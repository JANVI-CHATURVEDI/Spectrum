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

    # ------------------------------------------------------------------
    # Phase 2 - advanced AI capabilities (Gemini with heuristic fallback)
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_json(text):
        """Tolerant JSON extraction from an LLM response."""
        text = (text or '').strip()
        if not text:
            return None
        if text.startswith('```'):
            text = re.sub(r'^```(json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
        start, end = text.find('{'), text.rfind('}')
        if start != -1 and end > start:
            text = text[start:end + 1]
        try:
            return json.loads(text)
        except Exception:
            return None

    @classmethod
    def has_gemini(cls) -> bool:
        return cls.get_gemini_client() is not None

    @classmethod
    def classify_from_image(
        cls, description: str = '', filename: str = '',
        image_bytes: bytes | None = None, mime_type: str = 'image/jpeg',
    ) -> dict:
        """
        Multimodal triage: photo + description -> category, severity,
        estimated volume, hazard flags and a confidence score.
        Falls back to the text-only heuristic when there is no API key,
        no image, or the call fails.
        """
        fallback = cls.classify_waste_and_severity(description, filename)

        if not image_bytes or not cls.has_gemini():
            # Heuristic hazard flags so the UI contract is stable
            fallback.setdefault('hazard_flags', cls._heuristic_hazards(description))
            fallback.setdefault('estimated_volume', cls._heuristic_volume(description))
            fallback.setdefault('ai_suggested', False)
            return fallback

        try:
            from google.genai import types
            client = cls.get_gemini_client()
            prompt = """You are SwachDrishti's civic waste triage AI looking at a citizen photo.

Return ONLY a raw JSON object with these keys:
- category: one of ["Overflowing bin", "Roadside dumping", "Illegal dumping", "Missed collection", "Mixed waste", "Plastic accumulation", "Construction waste", "E-Waste", "Other"]
- severity: one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
- estimated_volume: short human estimate, e.g. "2-3 bags", "half a truck", "300 kg
- hazard_flags: array chosen from ["medical", "chemical", "blocking_drain", "blocking_road", "fire_risk", "none"]
- confidence: float between 0.5 and 0.99
- summary: one concise civic sentence
- translated_text: if the photo or text contains Hindi/Hinglish text, the English translation, otherwise an empty string
No markdown fences."""
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    f"{prompt}\n\nCitizen description: {description}",
                ],
            )
            data = cls._extract_json(response.text)
            if not data:
                raise ValueError('model did not return JSON')
            return {
                'category': data.get('category') or fallback['category'],
                'severity': (data.get('severity') or fallback['severity']).upper(),
                'estimated_volume': data.get('estimated_volume') or fallback.get('estimated_volume', '1-2 bags'),
                'hazard_flags': data.get('hazard_flags') or [],
                'confidence': float(data.get('confidence', 0.9)),
                'summary': data.get('summary') or fallback.get('summary', ''),
                'translated_text': data.get('translated_text') or '',
                'source': 'gemini_vision',
                'ai_suggested': True,
            }
        except Exception as e:
            logger.info(f"Gemini vision fallback triggered: {e}")

        fallback.setdefault('hazard_flags', cls._heuristic_hazards(description))
        fallback.setdefault('estimated_volume', cls._heuristic_volume(description))
        fallback.setdefault('ai_suggested', False)
        return fallback

    @staticmethod
    def _heuristic_hazards(text: str) -> list:
        t = (text or '').lower()
        flags = []
        if any(w in t for w in ['medical', 'syringe', 'bandage', 'hospital waste']):
            flags.append('medical')
        if any(w in t for w in ['chemical', 'acid', 'paint', 'solvent', 'battery acid']):
            flags.append('chemical')
        if any(w in t for w in ['drain', 'storm', 'waterlog', 'clog']):
            flags.append('blocking_drain')
        if any(w in t for w in ['road', 'traffic', 'blocking', 'street']):
            flags.append('blocking_road')
        if any(w in t for w in ['fire', 'burning', 'smoke']):
            flags.append('fire_risk')
        return flags or ['none']

    @staticmethod
    def _heuristic_volume(text: str) -> str:
        t = (text or '').lower()
        if any(w in t for w in ['truck', 'huge', 'mountain', 'heap', 'tonnes', 'tons']):
            return 'full truck load'
        if any(w in t for w in ['many', 'several', 'pile']):
            return '5+ bags'
        return '1-2 bags'

    @classmethod
    def compare_cleanup(cls, before_bytes: bytes | None, after_bytes: bytes | None, notes: str = '') -> dict:
        """
        Compares a before photo with the worker's after photo.
        Returns a 0-100 cleanup score plus an explanation.
        """
        if before_bytes and after_bytes and cls.has_gemini():
            try:
                from google.genai import types
                client = cls.get_gemini_client()
                prompt = """You are a municipal sanitation auditor comparing a BEFORE photo and an AFTER photo of the same location.

Return ONLY raw JSON with:
- cleanup_score: integer 0-100 (100 = perfectly clean, 0 = unchanged)
- verified: boolean, true only when cleanup_score >= 70
- verdict: short string, e.g. "Cleanup verified" or "Residue remains"
- reasons: array of 1-3 short strings explaining the score
No markdown fences."""
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        types.Part.from_bytes(data=before_bytes, mime_type='image/jpeg'),
                        types.Part.from_bytes(data=after_bytes, mime_type='image/jpeg'),
                        f"BEFORE image is first, AFTER image is second.\nWorker notes: {notes}",
                    ],
                )
                data = cls._extract_json(response.text)
                if data:
                    score = max(0, min(100, int(data.get('cleanup_score', 0))))
                    return {
                        'cleanup_score': score,
                        'verified': bool(data.get('verified', score >= 70)),
                        'verdict': data.get('verdict') or ('Cleanup verified' if score >= 70 else 'Residue remains'),
                        'reasons': data.get('reasons') or [],
                        'source': 'gemini_vision',
                    }
            except Exception as e:
                logger.info(f"Gemini cleanup-compare fallback triggered: {e}")

        # Fallback: any after-photo plus notes counts as partial evidence
        score = 55 if after_bytes else 0
        if notes and len(notes) > 20:
            score += 20
        return {
            'cleanup_score': score,
            'verified': False,
            'verdict': 'Manual review required (AI vision unavailable)',
            'reasons': ['Set GEMINI_API_KEY to enable automated before/after comparison.'],
            'source': 'heuristic_engine',
        }

    @classmethod
    def translate_description(cls, text: str) -> dict:
        """Translate Hindi/Hinglish report text to English. No-op without a key."""
        if not text or not cls.has_gemini():
            return {'translated_text': '', 'detected_language': 'unknown', 'source': 'none'}
        try:
            client = cls.get_gemini_client()
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=(
                    "Translate the following citizen waste complaint into English. "
                    "It may be Hindi, Hinglish or English. Then classify it.\n"
                    "Return ONLY raw JSON: {\"detected_language\": ..., \"translated\": ..., "
                    "\"category\": ..., \"severity\": ...} with severity one of "
                    '["LOW","MEDIUM","HIGH","CRITICAL"].\n'
                    f"Text: {text}"
                ),
            )
            data = cls._extract_json(response.text)
            if data:
                return {
                    'translated_text': data.get('translated', ''),
                    'detected_language': data.get('detected_language', 'unknown'),
                    'category': data.get('category'),
                    'severity': data.get('severity'),
                    'source': 'gemini',
                }
        except Exception as e:
            logger.info(f"Translation fallback triggered: {e}")
        return {'translated_text': '', 'detected_language': 'unknown', 'source': 'none'}

    # Whitelisted keys a natural-language query may turn into ORM filters.
    SEARCH_WHITELIST = {
        'priority_level', 'status_in', 'category_icontains', 'zone',
        'address_icontains', 'min_age_hours', 'max_age_hours',
        'lat', 'lng', 'radius_meters',
    }

    @classmethod
    def structured_search(cls, query: str) -> dict | None:
        """
        Gemini structured output -> validated filter dict.
        Returns None so callers can fall back to the regex parser.
        """
        if not query or not cls.has_gemini():
            return None
        try:
            from google.genai import types
            client = cls.get_gemini_client()
            schema = types.Schema(
                type=types.Type.OBJECT,
                properties={
                    'priority_level': types.Schema(type=types.Type.STRING, enum=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
                    'status_in': types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                    'category_icontains': types.Schema(type=types.Type.STRING),
                    'zone': types.Schema(type=types.Type.STRING),
                    'address_icontains': types.Schema(type=types.Type.STRING),
                    'min_age_hours': types.Schema(type=types.Type.NUMBER),
                    'lat': types.Schema(type=types.Type.NUMBER),
                    'lng': types.Schema(type=types.Type.NUMBER),
                    'radius_meters': types.Schema(type=types.Type.NUMBER),
                },
            )
            config = types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=schema,
                temperature=0,
            )
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=(
                    "Convert this civic query into search filters. Only include filters "
                    f"the query actually implies.\nQuery: {query}"
                ),
                config=config,
            )
            data = cls._extract_json(response.text)
            if not isinstance(data, dict):
                return None
            clean = {k: v for k, v in data.items() if k in cls.SEARCH_WHITELIST and v not in (None, '', [])}
            return clean or None
        except Exception as e:
            logger.info(f"Structured search fallback triggered: {e}")
            return None

    @classmethod
    def write_insights(cls, stats: dict) -> dict:
        """
        LLM-authored recommendations built from REAL aggregated numbers.
        Always returns the full structure; heuristic text when no API key.
        """
        fallback_summary = (
            f"{stats.get('active_hotspots_count', 0)} active hotspots across "
            f"{stats.get('total_reports', 0)} reports. "
            f"Top category: {stats.get('top_category', 'Mixed waste')} "
            f"({stats.get('top_category_pct', 0)}%)."
        )
        if not cls.has_gemini():
            return {
                'summary': fallback_summary,
                'actions': [
                    {'title': 'Deploy Smart Sensor Bin', 'detail': f"Target {stats.get('top_zone', 'Zone 1')}", 'priority': 'HIGH'},
                    {'title': 'Route Frequency Shift', 'detail': 'Advance morning sweep', 'priority': 'MEDIUM'},
                    {'title': 'Citizen Segregation Drive', 'detail': 'Reward top verifiers', 'priority': 'LOW'},
                ],
                'source': 'heuristic_engine',
            }
        try:
            client = cls.get_gemini_client()
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=(
                    "You are a municipal sanitation advisor. Using ONLY these real metrics, "
                    "write a 2-sentence executive summary and exactly 3 concrete actions.\n"
                    "Return ONLY raw JSON: {\"summary\": str, \"actions\": [{\"title\": str, "
                    "\"detail\": str, \"priority\": \"HIGH\"|\"MEDIUM\"|\"LOW\"}]}\n"
                    f"Metrics: {json.dumps(stats)}"
                ),
            )
            data = cls._extract_json(response.text)
            if data and data.get('summary') and data.get('actions'):
                return {
                    'summary': data['summary'],
                    'actions': data['actions'][:3],
                    'source': 'gemini',
                }
        except Exception as e:
            logger.info(f"Insights fallback triggered: {e}")
        return {
            'summary': fallback_summary,
            'actions': [],
            'source': 'heuristic_engine',
        }
