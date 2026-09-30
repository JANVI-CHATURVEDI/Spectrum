from datetime import datetime, timezone

SEVERITY_SCORES = {
    'CRITICAL': 40,
    'HIGH': 30,
    'MEDIUM': 20,
    'LOW': 10,
}

def calculate_priority(
    severity: str = 'MEDIUM',
    nearby_reports_count: int = 0,
    age_in_hours: float = 0.0,
    is_recurring_hotspot: bool = False,
    is_sensitive_context: bool = False,
) -> tuple[float, str, list[str]]:
    """
    Deterministic & Explainable Priority Engine for SwachDrishti.
    
    Returns:
        (priority_score: float, priority_level: str, factors: list[str])
    """
    severity_norm = (severity or 'MEDIUM').upper()
    sev_score = SEVERITY_SCORES.get(severity_norm, 20)
    
    # Factors list
    factors = []
    
    # 1. Severity contribution
    factors.append(f"Reported severity: {severity_norm}")
    
    # 2. Nearby density contribution
    density_score = min(nearby_reports_count * 8.0, 32.0)
    if nearby_reports_count > 0:
        factors.append(f"{nearby_reports_count} nearby reports in area (+{int(density_score)} pts)")
        
    # 3. Waiting age contribution (1.5 pts per hour, max 24 pts)
    age_score = min(max(age_in_hours, 0.0) * 1.5, 24.0)
    if age_in_hours >= 1.0:
        hours_display = int(age_in_hours) if age_in_hours >= 2 else round(age_in_hours, 1)
        factors.append(f"Unresolved for {hours_display} hours (+{int(age_score)} pts)")
        
    # 4. Recurrence contribution
    recurrence_score = 20.0 if is_recurring_hotspot else 0.0
    if is_recurring_hotspot:
        factors.append("Recurring waste hotspot area (+20 pts)")
        
    # 5. Sensitive context contribution (schools, hospitals, transit hubs)
    context_score = 10.0 if is_sensitive_context else 0.0
    if is_sensitive_context:
        factors.append("Sensitive civic zone / high footfall area (+10 pts)")
        
    total_score = sev_score + density_score + age_score + recurrence_score + context_score
    total_score = round(total_score, 1)
    
    if total_score >= 65:
        level = 'CRITICAL'
    elif total_score >= 45:
        level = 'HIGH'
    elif total_score >= 25:
        level = 'MEDIUM'
    else:
        level = 'LOW'
        
    return total_score, level, factors
