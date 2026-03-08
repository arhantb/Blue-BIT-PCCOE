from twilio.rest import Client
import time
import logging

class NotificationService:
    def __init__(self, account_sid, auth_token, from_number):
        self.enabled = False
        self.from_number = from_number
        self.police_contacts = {
            "NORTH": "918956747898",
            "SOUTH": "918956747898",
            "EAST": "919356431340",
            "WEST": "919356431340"
        }
        self.last_call_time = {} 
        self.cooldown = 45 

        # Validation: Check if credentials are placeholders or empty
        if not account_sid or not auth_token or "AC" not in account_sid:
            print("[TWILIO] WARNING: Credentials missing or invalid. Operating in 'Simulation Only' mode.")
            self.client = None
            return

        try:
            self.client = Client(account_sid, auth_token)
            # Minimal check: will only fail on actual usage, but we set enabled to True
            self.enabled = True
            print(f"[TWILIO] Service Initialized (Source: {self.from_number})")
        except Exception as e:
            print(f"[TWILIO] Initialization Error: {str(e)}")
            self.enabled = False

    def _format_number(self, num: str) -> str:
        """Ensures number is in E.164 format (+91...)"""
        clean = "".join(filter(str.isdigit, num))
        if len(clean) == 10:
            return f"+91{clean}"
        if len(clean) == 12 and clean.startswith("91"):
            return f"+{clean}"
        if not clean.startswith("+") and len(clean) > 5:
            return f"+{clean}"
        return num

    def notify_emergency(self, direction: str, vehicle_type: str):
        direction = direction.upper()
        current_time = time.time()
        
        # 1. Check if Service is Enabled
        if not self.enabled:
            print(f"[SIMULATION] EMERGENCY DISPATCH (MOCK): Priority cleared for {direction} approach ({vehicle_type})")
            return

        # 2. Debounce/Cooldown check
        if direction in self.last_call_time:
            if current_time - self.last_call_time[direction] < self.cooldown:
                print(f"[TWILIO] Call to {direction} suppressed (Cooldown: {int(self.cooldown - (current_time - self.last_call_time[direction]))}s left)")
                return

        raw_number = self.police_contacts.get(direction)
        if not raw_number:
            print(f"[TWILIO] Error: No contact found for {direction} Approach")
            return

        target_number = self._format_number(raw_number)

        try:
            print(f"[TWILIO] ATTEMPTING CALL -> {direction} | Target: {target_number} | Vehicle: {vehicle_type}")
            
            twiml = f"<Response><Say voice='alice'>Emergency Alert. An {vehicle_type.replace('_', ' ')} has been detected at the {direction} approach. Priority preemption is active.</Say></Response>"
            
            call = self.client.calls.create(
                to=target_number,
                from_=self.from_number,
                twiml=twiml
            )
            
            self.last_call_time[direction] = current_time
            print(f"[TWILIO] SUCCESS | SID: {call.sid} | Status: {call.status}")
            
        except Exception as e:
            err_msg = str(e).lower()
            if "authenticate" in err_msg or "20003" in err_msg:
                print("[TWILIO] AUTHENTICATION ERROR (20003): Your Account SID or Auth Token is incorrect.")
                print("[TWILIO] ACTION: Open your Twilio Console, copy the 'Account SID' and 'Auth Token', and paste them into your .env file.")
                print("[TWILIO] NOTE: System will now default to 'Simulation Only' mode to prevent further errors.")
                self.enabled = False # Disable to prevent flood of auth errors
            elif "verified" in err_msg:
                print("[TWILIO] PERMISSION ERROR: Trial accounts can only call VERIFIED numbers.")
                print(f"[TWILIO] ACTION: Verify {target_number} in your Twilio Console or upgrade your account.")
            else:
                print(f"[TWILIO] DISPATCH ERROR: {str(e)}")
