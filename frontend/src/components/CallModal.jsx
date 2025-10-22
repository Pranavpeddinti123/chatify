import { useCallStore } from "../store/UseCallStore";
import { PhoneIcon, VideoIcon } from "lucide-react";

export default function CallModal() {
  const {
    isReceivingCall,
    isCalling,
    callAnswered,
    callerName,
    answerCall,
    endCall,
    callType,
    localStream,
    remoteStream,
  } = useCallStore();

  // Receiver: waiting for accept/decline
  if (isReceivingCall && !isCalling) {
    return (
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 w-[420px] bg-slate-800 border-2 border-cyan-500 rounded-2xl shadow-lg flex flex-col items-center px-8 py-6">
        <div className="font-bold text-cyan-400 text-2xl mb-2">
          {callerName} is {callType === "video" ? "video calling you" : "calling you"}…
        </div>
        <span className="text-slate-300 text-base mb-4">{callType === "video" ? "Video" : "Audio"} Call</span>
        <div className="flex justify-center gap-8 w-full mb-2">
          <button
            className="bg-green-500 text-white rounded-full px-8 py-3 font-bold text-lg hover:bg-green-400 flex items-center gap-2"
            onClick={answerCall}
          >
            <PhoneIcon className="w-6 h-6" /> Accept
          </button>
          <button
            className="bg-red-500 text-white rounded-full px-8 py-3 font-bold text-lg hover:bg-red-400 flex items-center gap-2"
            onClick={endCall}
          >
            <PhoneIcon className="w-6 h-6 rotate-135" /> Decline
          </button>
        </div>
      </div>
    );
  }

  // Caller: waiting for receiver to answer
  if (isCalling && !callAnswered) {
    return (
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 w-[420px] bg-slate-800 border-2 border-cyan-500 rounded-2xl shadow-lg flex flex-col items-center px-8 py-8">
        <div className="font-bold text-cyan-400 text-2xl mb-6">Calling…</div>
        <div className="mb-6 text-lg text-cyan-200">Waiting for other user to accept your {callType === "video" ? "video" : "audio"} call…</div>
        <button className="bg-red-500 text-white rounded-full px-8 py-3 font-bold text-lg hover:bg-red-400 mt-2"
          onClick={endCall}
        >
          Cancel Call
        </button>
      </div>
    );
  }

  // Connected modal, both sides
  if (isCalling && callAnswered) {
    return (
      <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 border-2 border-cyan-500 rounded-2xl shadow-lg flex flex-col items-center px-8 py-8 ${callType === "video" ? "w-[700px]" : "w-[420px]"}`}>
        <div className="font-bold text-white text-2xl mb-6">{callType === "video" ? "Video" : "Audio"} Call Connected</div>
        {callType === "video" && (
          <div className="flex gap-5 w-full justify-center mb-8">
            <video
              className="w-[250px] h-[180px] rounded-xl bg-black border-2 border-cyan-400"
              autoPlay
              muted
              playsInline
              ref={video => { if (video && localStream) { video.srcObject = localStream; video.muted = true; video.play().catch(() => {}); } }}
            />
            <video
              className="w-[250px] h-[180px] rounded-xl bg-black border-2 border-cyan-400"
              autoPlay
              playsInline
              ref={video => { if (video && remoteStream) { video.srcObject = remoteStream; video.play().catch(() => {}); } }}
            />
          </div>
        )}
        {callType === "audio" && (
          <audio
            autoPlay
            controls={false}
            ref={audio => { if (audio && remoteStream) { audio.srcObject = remoteStream; audio.play().catch(() => {}); } }}
          />
        )}
        <button className="bg-red-500 text-white rounded-full px-8 py-3 font-bold text-lg hover:bg-red-400 mt-2"
          onClick={endCall}
        >
          End Call
        </button>
      </div>
    );
  }

  return null;
}
