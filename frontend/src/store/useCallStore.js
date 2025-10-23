import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: [
      "turn:YOUR_TURN_SERVER:3478?transport=udp",
      "turn:YOUR_TURN_SERVER:3478?transport=tcp"
    ],
    username: "YOUR_TURN_USERNAME",
    credential: "YOUR_TURN_PASSWORD",
  },
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

  // ------- CALLER -------
  startCall: async ({ userId, type }) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    set({ isCalling: true, callAnswered: false, remoteUser: userId, callType: type });

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
      } else {
        throw error;
      }
    }
    set({ localStream });

    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    set({ connection });

    localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));

    const remoteStream = new MediaStream();
    connection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        set({ remoteStream });
      }
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:ice-candidate", { to: userId, candidate: event.candidate });
      }
    };

    connection.onconnectionstatechange = () =>
      console.log("connectionState:", connection.connectionState);

    connection.oniceconnectionstatechange = () =>
      console.log("iceConnectionState:", connection.iceConnectionState);

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    socket.emit("call:user", { to: userId, offer, type });

    // SOCKET SIGNALING (cleaned up)
    socket.off("call:answer");
    socket.on("call:answer", async ({ answer }) => {
      set({ callAnswered: true });
      try {
        if (!connection.currentRemoteDescription) {
          await connection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (e) {
        console.error("Error setting remote desc:", e);
      }
    });

    socket.off("call:ended");
    socket.on("call:ended", () => get().endCall(false));

    socket.off("call:ice-candidate");
    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (candidate) {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch(e) {
          console.error("Error adding ICE:", e);
        }
      }
    });
  },

  // ------- RECEIVER -------
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
      } else {
        throw error;
      }
    }
    set({ localStream });

    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    set({ connection });

    localStream.getTracks().forEach((t) => connection.addTrack(t, localStream));

    const remoteStream = new MediaStream();
    connection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
        set({ remoteStream });
      }
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

    socket.off("call:ended");
    socket.on("call:ended", () => get().endCall(false));

    socket.off("call:ice-candidate");
    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (candidate) {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ICE:", e);
        }
      }
    });
  },

  /** END/CANCEL/DECLINE CALL **/
  endCall: (shouldNotify = true) => {
    const socket = useAuthStore.getState().socket;
    const { remoteUser, connection, localStream } = get();

    if (shouldNotify && socket && remoteUser) {
      socket.emit("call:ended", { to: remoteUser });
    }

    if (connection) {
      connection.ontrack = null;
      connection.onicecandidate = null;
      try {
        connection.close();
      } catch {}
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
