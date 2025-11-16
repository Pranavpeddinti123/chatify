import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

// Use this for testing, replace with paid credentials for production
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: ["turn:relay.metered.ca:443"],
    username: "open",
    credential: "open"
  }
];

export const useCallStore = create((set, get) => ({
  // Call state
  isCalling: false,
  callAnswered: false,
  isReceivingCall: false,
  remoteUser: null,
  callType: null,
  callerName: null,
  connection: null,
  localStream: null,
  remoteStream: null,
  incomingOffer: null,

  setCallState: (state) => set(state),

  // Utility: Clean up all signaling
  cleanupSocketListeners: (socket) => {
    if (!socket) return;
    socket.off("call:answer");
    socket.off("call:ended");
    socket.off("call:ice-candidate");
  },

  endCall: (shouldNotify = true) => {
    const socket = useAuthStore.getState().socket;
    const { remoteUser, connection, localStream } = get();

    if (shouldNotify && socket && remoteUser) {
      socket.emit("call:ended", { to: remoteUser });
    }

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    if (connection) {
      connection.ontrack = null;
      connection.onicecandidate = null;
      connection.onconnectionstatechange = null;
      connection.oniceconnectionstatechange = null;
      try {
        connection.close();
      } catch {}
    }

    get().cleanupSocketListeners(socket);

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
      callerName: null
    });
  },

  // Caller side
  startCall: async ({ userId, type }) => {
    const socket = useAuthStore.getState().socket;
    const callerName = useAuthStore.getState().user?.name || "You";
    if (!socket || !userId) return;

    set({ isCalling: true, callAnswered: false, remoteUser: userId, callType: type, callerName });

    let localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
    } catch (error) {
      if (type === "video") {
        alert("No camera detected. Switching to audio only.");
        localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        set({ callType: 'audio' });
      } else {
        get().endCall(true);
        return;
      }
    }
    set({ localStream });

    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    set({ connection });

    localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));

    const remoteStream = new MediaStream();
    connection.ontrack = (event) => {
      if (event.streams && event.streams[0] && event.streams[0].getTracks().length > 0) {
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        set({ remoteStream });
      }
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:ice-candidate", { to: userId, candidate: event.candidate });
      }
    };

    connection.oniceconnectionstatechange = () => {
      const state = connection.iceConnectionState;
      if (state === 'failed' || state === 'closed') {
        get().endCall(false);
      }
    };
    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;
      if (state === 'disconnected' || state === 'failed') {
        get().endCall(false);
      }
    };

    try {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      socket.emit("call:user", { to: userId, offer, type, name: callerName });
    } catch (e) {
      get().endCall(true);
      return;
    }

    get().cleanupSocketListeners(socket);

    socket.on("call:answer", async ({ answer }) => {
      set({ callAnswered: true });
      try {
        if (connection && !connection.currentRemoteDescription) {
          await connection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (e) {
        //
      }
    });

    socket.on("call:ended", () => get().endCall(false));

    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (candidate && connection) {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
    });
  },

  // Receiver side
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

    let localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
    } catch (error) {
      if (callType === "video") {
        alert("No camera detected. Switching to audio only.");
        localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        set({ callType: 'audio' });
      } else {
        get().endCall(true);
        return;
      }
    }
    set({ localStream });

    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    set({ connection });

    localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));

    const remoteStream = new MediaStream();
    connection.ontrack = (event) => {
      if (event.streams && event.streams[0] && event.streams[0].getTracks().length > 0) {
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        set({ remoteStream });
      }
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:ice-candidate", { to: remoteUser, candidate: event.candidate });
      }
    };
    connection.oniceconnectionstatechange = () => {
      const state = connection.iceConnectionState;
      if (state === 'failed' || state === 'closed') {
        get().endCall(false);
      }
    };
    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;
      if (state === 'disconnected' || state === 'failed') {
        get().endCall(false);
      }
    };

    try {
      await connection.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      socket.emit("call:answer", { to: remoteUser, answer });
    } catch (e) {
      get().endCall(true);
      return;
    }

    get().cleanupSocketListeners(socket);

    socket.on("call:ended", () => get().endCall(false));

    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (candidate && connection) {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
    });
  },
}));
