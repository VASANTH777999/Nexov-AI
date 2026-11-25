import uvicorn
import os
import sys

# Ensure project root directory is on sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

if __name__ == "__main__":
    if "--init-only" in sys.argv:
        from backend.app.database import init_db
        init_db()
        print("Database initialized successfully.")
        sys.exit(0)

    port = int(os.getenv("PORT", "8000"))
    print(f"Starting NexovAI Voice Clinic Backend on port {port}...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)
