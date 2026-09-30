from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class AIAnonRateThrottle(AnonRateThrottle):
    scope = 'ai'

class AIUserRateThrottle(UserRateThrottle):
    scope = 'ai'

class PublicAnonRateThrottle(AnonRateThrottle):
    scope = 'public'
