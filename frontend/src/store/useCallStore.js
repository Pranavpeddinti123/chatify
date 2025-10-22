import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:global.relay.metered.ca:80",
    username: "openai",
    credential: "openai"
  }
];

export const useCallStore = create((set, get) => ({
  isCalling: false,
  callAnswered: false,
  isReceivingCall: false,
  remoteUser: null,
  callType: null,
  connection: null,
  localStream: null,
  remoteStream: null,
  incomingOffer: null,
  callerName: null,

  setCallState: (state) => set(state),

  /** CALLER side (initiator) **/
  startCall: async ({ userId, type }) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    set({ isCalling: true, callAnswered: false, remoteUser: userId, callType: type });

    // getUserMedia with camera fallback logic
    let localStream = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: type === "video", audio: true });
    } catch (error) {
      if (type === "video") {
        alert("No camera detected or accessible. Proceeding with audio only.");
        localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } else {
        alert("No microphone detected or accessible.");
        throw error;
      }
    }
    set({ localStream });

    // Peer connection with TURN + STUN!
    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    set({ connection });

    localStream.getTracks().forEach(track => connection.addTrack(track, localStream));
    const remoteStream = new MediaStream();
    set({ remoteStream });

    connection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
      set({ remoteStream });
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:ice-candidate", { to: userId, candidate: event.candidate });
      }
    };

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    socket.emit("call:user", { to: userId, offer, type });

    socket.off("call:answered");
    socket.on("call:answered", async ({ answer }) => {
      set({ callAnswered: true });
      if (!connection.currentRemoteDescription) {
        await connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.off("call:ice-candidate");
    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (candidate) {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ICE candidate:", e);
        }
      }
    });

    socket.off("call:ended");
    socket.on("call:ended", () => get().endCall(false));
  },

  /** RECEIVER side (invitee) **/
  receiveCall: ({ from, offer, name, type }) => {
    set({
      isReceivingCall: true,
      isCalling: false,
      callAnswered: false,
      remoteUser: from,
      incomingOffer: offer,
      callerName: name,
      callType: type,
    });
  },

  answerCall: async () => {
    const { remoteUser, incomingOffer, callType } = get();
    const socket = useAuthStore.getState().socket;
    if (!socket || !incomingOffer || !remoteUser) return;

    set({ isReceivingCall: false, isCalling: true, callAnswered: true });

    let localStream = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: callType === "video", audio: true });
    } catch (error) {
      if (callType === "video") {
        alert("No camera detected or accessible. Proceeding with audio only.");
        localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } else {
        alert("No microphone detected or accessible.");
        throw error;
      }
    }
    set({ localStream });

    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    set({ connection });

    localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
    const remoteStream = new MediaStream();
    set({ remoteStream });

    connection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
      set({ remoteStream });
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:ice-candidate", { to: remoteUser, candidate: event.candidate });
      }
    };

    await connection.setRemoteDescription(new RTCSessionDescription(incomingOffer));
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    socket.emit("call:answer", { to: remoteUser, answer });

    socket.off("call:ice-candidate");
    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (candidate) {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ICE candidate:", e);
        }
      }
    });

    socket.off("call:ended");
    socket.on("call:ended", () => get().endCall(false));
  },

  endCall: (shouldNotify = true) => {
    const socket = useAuthStore.getState().socket;
    const { remoteUser, connection, localStream } = get();

    if (shouldNotify && socket && remoteUser) {
      socket.emit("call:end", { to: remoteUser });
    }

    if (connection) {
      connection.ontrack = null;
      connection.onicecandidate = null;
      connection.close();
    }

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    set({
      isCalling: false,
      callAnswered: false,
      isReceivingCall: false,
      remoteUser: null,
      callType: null,
      remoteStream: null,
      connection: null,
      incomingOffer: null,
      localStream: null,
      callerName: null,
    });
  },
}));
