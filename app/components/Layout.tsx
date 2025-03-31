import { Novatrix } from "uvcanvas";

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen">
      {/* Background Novatrix */}
      <div className="fixed inset-0 -z-10">
        <Novatrix />
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 