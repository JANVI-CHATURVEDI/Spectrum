import os
import re
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class AIService:
    """
    Pluggable AI Service layer for SwachDrishti.
    Integrates with Google Gemini when GEMINI_API_KEY is available,
    and seamlessly falls back to fast, robust rule-based algorithms.
    """
    
    @classmethod
    def get_gemini_client(cls):
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        if not api_key:
            return None
        try:
            from google import genai
            return genai.Client(api_key=api_key)
        except Exception as e:
            logger.warning(f"Could not initialize Gemini Client: {e}")
            return None

    @classmethod
    def classify_waste_and_severity(cls, description: str, filename: str = '') -> dict:
        """
        Classifies waste category, severity, and generates an executive summary.
        """
        prompt_text = f"Text: {description} (file: {filename})"
        client = cls.get_gemini_client()
        
        if client:
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"""You are SwachDrishti's civic waste triage AI.
Analyze the citizen waste report description: "{prompt_text}".
Return ONLY a valid JSON object with these keys:
- category: one of ["Overflowing bin", "Roadside dumping", "Illegal dumping", "Missed collection", "Mixed waste", "Plastic accumulation", "Construction waste", "E-Waste", "Other"]
- severity: one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
- summary: concise 1-sentence civic summary
- confidence: float between 0.8 and 0.99
Do not include markdown code block formatting, just the raw JSON.
"""
                )
                text = response.text.strip()
                if text.startswith('```'):
                    text = re.sub(r'^```(json)?\n', '', text)
                    text = re.sub(r'\n```$', '', text)
                data = json.loads(text)
                return {
                    'category': data.get('category', 'Mixed waste'),
                    'severity': data.get('severity', 'MEDIUM'),
                    'summary': data.get('summary', description[:100]),
                    'confidence': float(data.get('confidence', 0.92)),
                    'source': 'gemini'
                }
            except Exception as e:
                logger.info(f"Gemini call fallback triggered: {e}")

        # Robust Heuristic / Rule-based Fallback
        desc_lower = (description + ' ' + filename).lower()
        
        # Categorization heuristics
        if any(w in desc_lower for w in ['bin', 'dustbin', 'overflow', 'spilling', 'container']):
            category = 'Overflowing bin'
            severity = 'HIGH' if any(w in desc_lower for w in ['huge', 'blocking', 'street', 'foul', 'stink']) else 'MEDIUM'
        elif any(w in desc_lower for w in ['plastic', 'bottles', 'polythene', 'wrappers', 'bags']):
            category = 'Plastic accumulation'
            severity = 'MEDIUM'
        elif any(w in desc_lower for w in ['construction', 'debris', 'cement', 'bricks', 'malba', 'rubble']):
            category = 'Construction waste'
            severity = 'HIGH'
        elif any(w in desc_lower for w in ['electronic', 'e-waste', 'wire', 'battery', 'computer', 'phone']):
            category = 'E-Waste'
            severity = 'HIGH'
        elif any(w in desc_lower for w in ['illegal', 'dumped', 'midnight', 'commercial', 'truck']):
            category = 'Illegal dumping'
            severity = 'CRITICAL'
        elif any(w in desc_lower for w in ['missed', 'uncollected', 'truck didn', 'not picked']):
            category = 'Missed collection'
            severity = 'MEDIUM'
        elif any(w in desc_lower for w in ['road', 'pavement', 'sidewalk', 'curb']):
            category = 'Roadside dumping'
            severity = 'HIGH'
        else:
            category = 'Mixed waste'
            severity = 'MEDIUM'
            
        # Urgency modifiers
        if any(w in desc_lower for w in ['critical', 'urgent', 'drain', 'hospital', 'school', 'fire', 'hazard', 'toxic', 'smell', 'stench']):
            severity = 'CRITICAL'

        summary = f"Detected {category.lower()} requiring municipal response. Priority: {severity}."
        if description:
            summary = f"{category}: {description[:80]}..." if len(description) > 80 else f"{category}: {description}"

        return {
            'category': category,
            'severity': severity,
            'summary': summary,
            'confidence': 0.88,
            'source': 'heuristic_engine'
        }

    @classmethod
    def generate_operational_insights(cls, stats: dict) -> list[dict]:
        """
        Generates actionable municipal operational insights from current database metrics.
        """
        insights = []
        
        # 1. Hotspot recommendation
        hotspot_count = stats.get('active_hotspots_count', 0)
        if hotspot_count > 0:
            insights.append({
                'id': 1,
                'type': 'hotspot_alert',
                'title': f"{hotspot_count} recurring hotspots need intervention",
                'description': "Clustered recurrent reports in Zone 1 (Mall Road) indicate bin capacity deficit. Recommended: deploy 1100L heavy-duty compactor bins and increase evening patrol.",
                'priority': 'HIGH',
                'action_label': 'View Hotspots'
            })
            
        # 2. Category trend
        top_category = stats.get('top_category', 'Mixed waste')
        insights.append({
            'id': 2,
            'type': 'trend_insight',
            'title': f"{top_category} reports increased this week",
            'description': f"{top_category} accounts for {stats.get('top_category_pct', 42)}% of current complaints. Public awareness on source segregation is advised.",
            'priority': 'MEDIUM',
            'action_label': 'Launch Awareness'
        })
        
        # 3. Zone demand
        top_zone = stats.get('top_pickup_zone', 'Zone 1 - Central')
        insights.append({
            'id': 3,
            'type': 'resource_allocation',
            'title': f"Pickup demand is highest in {top_zone}",
            'description': f"Dynamic dispatch suggestion: Reassign 2 mobile collection vans to {top_zone} between 10:00 AM - 1:00 PM to eliminate collection backlog.",
            'priority': 'HIGH',
            'action_label': 'Dispatch Team'
        })

        return insights
