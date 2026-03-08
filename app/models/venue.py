from pydantic import BaseModel

class VenueRequest(BaseModel):
    venue: str
