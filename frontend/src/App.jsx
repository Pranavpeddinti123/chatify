import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import StatusPage from "./pages/StatusPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect, useState } from "react";
import PageLoader from "./components/PageLoader";
import CallModal from "./components/CallModal";
import ChatbotAssistant from "./components/ChatbotAssistant";
import { Toaster } from "react-hot-toast";
import { SparklesIcon } from "lucide-react";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-900 relative flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />

      <CallModal />

      <ChatbotAssistant isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Floating AI Assistant Button */}
      {authUser && (
        <button
          onClick={() => setIsChatbotOpen(!isChatbotOpen)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 z-30 flex items-center justify-center"
          title="Open AI Assistant"
        >
          <SparklesIcon className="w-6 h-6" />
        </button>
      )}

      <Routes>
        <Route
          path="/"
          element={authUser ? <ChatPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/status"
          element={authUser ? <StatusPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;
