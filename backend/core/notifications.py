import logging
import threading

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _fire_async(fn, *args, **kwargs):
    threading.Thread(target=fn, args=args, kwargs=kwargs, daemon=True).start()


def send_email_safe(to_email, subject, message):
    if not to_email:
        return False

    def _send():
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email])
            logger.info('Email sent to %s: %s', to_email, subject)
        except Exception as e:
            logger.warning('Email to %s failed (non-fatal): %s', to_email, e)

    _fire_async(_send)
    return True


def send_sms_safe(to_phone, message):
    if not to_phone:
        return False
    sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_FROM_NUMBER', '')
    if not (sid and token and from_number):
        logger.info('SMS skipped (Twilio not configured) to %s: %s', to_phone, message[:120])
        return False

    def _send():
        try:
            from twilio.rest import Client
            Client(sid, token).messages.create(body=message, from_=from_number, to=to_phone)
            logger.info('SMS sent to %s', to_phone)
        except Exception as e:
            logger.warning('SMS to %s failed (non-fatal): %s', to_phone, e)

    _fire_async(_send)
    return True


def _citizen_contact(report):
    citizen = getattr(report, 'citizen', None)
    email = getattr(citizen, 'email', '') or ''
    phone = getattr(citizen, 'phone', '') or ''
    if citizen:
        name = citizen.get_full_name() or citizen.username
    else:
        name = 'Resident'
    return email, phone, name


def notify_report_submitted(report):
    try:
        email, phone, name = _citizen_contact(report)
        if not (email or phone):
            return
        link = f'{settings.FRONTEND_URL}/citizen'
        subject = f'Report #{report.id} received — {report.title[:60]}'
        body = (
            f'Hi {name},\n\n'
            f'Your report "{report.title}" (#{report.id}) has been received and '
            f'scored {report.priority_level} priority.\n'
            f'Location: {report.address or "pinned on map"}\n\n'
            f'Track it here: {link}\n'
            f'You will also hear from us when the cleanup is ready for your verification.\n\n'
            f'— Team SwachDrishti'
        )
        if email:
            send_email_safe(email, subject, body)
        if phone:
            send_sms_safe(phone, f'SwachDrishti: report #{report.id} received ({report.priority_level} priority). Track: {link}')
    except Exception as e:
        logger.warning('notify_report_submitted failed (non-fatal): %s', e)


def notify_verification_required(report):
    try:
        email, phone, name = _citizen_contact(report)
        if not (email or phone):
            return
        link = f'{settings.FRONTEND_URL}/citizen'
        subject = f'Action needed: verify cleanup for report #{report.id}'
        body = (
            f'Hi {name},\n\n'
            f'Good news — our field team has marked "{report.title}" (#{report.id}) as cleaned.\n'
            f'Please confirm the resolution here: {link}\n\n'
            f'If the spot is still dirty, you can reopen it from the same page and '
            f'it will be re-escalated automatically.\n\n'
            f'— Team SwachDrishti'
        )
        if email:
            send_email_safe(email, subject, body)
        if phone:
            send_sms_safe(phone, f'SwachDrishti: report #{report.id} cleaned — please verify: {link}')
    except Exception as e:
        logger.warning('notify_verification_required failed (non-fatal): %s', e)


def notify_verification_outcome(report, is_resolved):
    try:
        email, phone, name = _citizen_contact(report)
        if not (email or phone):
            return
        if is_resolved:
            subject = f'Report #{report.id} closed — thank you'
            body = (
                f'Hi {name},\n\n'
                f'Thanks for verifying "{report.title}" (#{report.id}). '
                f'The case is now closed and +30 impact points were added to your profile.\n\n'
                f'— Team SwachDrishti'
            )
            sms = f'SwachDrishti: report #{report.id} closed. +30 impact points. Thank you!'
        else:
            subject = f'Report #{report.id} reopened and escalated'
            body = (
                f'Hi {name},\n\n'
                f'"{report.title}" (#{report.id}) has been reopened and escalated to '
                f'{report.priority_level} priority. A crew will be re-dispatched shortly.\n\n'
                f'— Team SwachDrishti'
            )
            sms = f'SwachDrishti: report #{report.id} reopened & escalated to {report.priority_level}. Crew re-dispatched.'
        if email:
            send_email_safe(email, subject, body)
        if phone:
            send_sms_safe(phone, sms)
    except Exception as e:
        logger.warning('notify_verification_outcome failed (non-fatal): %s', e)
