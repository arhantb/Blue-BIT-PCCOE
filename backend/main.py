from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import atcs

app = FastAPI(title="ATCS Intelligence Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routes
app.include_router(atcs.router, prefix="/api/atcs")

@app.get("/")
async def root():
    return {"status": "online", "system": "ATCS Intelligence Unit"}

@app.get("/data")
async def get_combined_data():
    """
    Returns a combined object containing all analyzed traffic states and AI decisions
    for the ICCC dashboard sync.
    """
    # Create the Input/Output lists expected by the frontend
    result_list = []
    for sector, data in atcs.LATEST_DATA.items():
        if data:
            result_list.append(data)
        else:
            # Fallback to default template if no live data yet
            result_list.append(atcs.get_default_data(sector))
            
    # Returning a redundant payload to guarantee compatibility with all parsing variants
    return {
        "input": [r["input"] for r in result_list],
        "inputs": [r["input"] for r in result_list],
        "output": [r["output"] for r in result_list],
        "outputs": [r["output"] for r in result_list]
    }

@app.get("/outputs")
async def get_outputs():
    """
    Returns the full history of traffic decisions for the output page.
    """
    return atcs.DECISION_HISTORY

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
