import { CameraGrid } from "@/components/camera-grid";

export default function CamerasPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background py-3">
        <div className="container">
          <h1 className="text-2xl font-bold">FindAndSeekPro - Camera Surveillance</h1>
          <p className="text-muted-foreground">Live monitoring system for missing persons cases</p>
        </div>
      </header>
      <main className="flex-1">
        <CameraGrid />
      </main>
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FindAndSeekPro - AI-Powered Search and Rescue Platform
        </div>
      </footer>
    </div>
  );
} 