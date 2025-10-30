import React, { useEffect, useRef, useState } from "react"
import { Mic, MicOff, PhoneOff } from "lucide-react"
import socket from "../socket"

export default function VideoCall({ roomId }) {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const [peerConnection, setPeerConnection] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoStarted, setIsVideoStarted] = useState(false)
  const localStream = useRef(null)

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }, // Public STUN server
    ],
  }

  useEffect(() => {
    if (!peerConnection) {
      const pc = new RTCPeerConnection(iceServers)
      console.log("PeerConnection initialized:", pc)
      setPeerConnection(pc)

      const iceCandidateQueue = [] // Queue to store ICE candidates until remote description is set

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Emitting ICE candidate:", event.candidate)
          socket.emit("ice-candidate", { roomId, candidate: event.candidate })
        }
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log("Remote Stream:", event.streams[0])
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }
    }

    return () => {
      if (peerConnection) {
        peerConnection.close()
        console.log("PeerConnection closed")
      }
    }
  }, [peerConnection, roomId])

  useEffect(() => {
    const pc = new RTCPeerConnection(iceServers)
    console.log("PeerConnection initialized:", pc)
    setPeerConnection(pc)

    const iceCandidateQueue = [] // Queue to store ICE candidates until remote description is set

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Emitting ICE candidate:", event.candidate)
        socket.emit("ice-candidate", { roomId, candidate: event.candidate })
      }
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log("Remote Stream:", event.streams[0])
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    // Listen for incoming ICE candidates (from server relay)
    socket.on("receive-candidate", async (candidate) => {
      console.log("Received ICE candidate from:", candidate)
      if (!pc.remoteDescription || !pc.remoteDescription.type) {
        console.log("Remote description not set yet. Queuing ICE candidate.")
        iceCandidateQueue.push(candidate)
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
          console.log("ICE candidate added successfully")
        } catch (error) {
          console.error("Error adding ICE candidate:", error)
        }
      }
    })

    // Listen for incoming offer from server
    socket.on("receive_offer", async (offer) => {
      console.log("Received offer")
      await pc.setRemoteDescription(new RTCSessionDescription(offer)) // Set the remote description
      console.log("Remote description set. Adding queued ICE candidates.")
      while (iceCandidateQueue.length > 0) {
        const candidate = iceCandidateQueue.shift()
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
          console.log("Queued ICE candidate added successfully")
        } catch (error) {
          console.error("Error adding queued ICE candidate:", error)
        }
      }
      const answer = await pc.createAnswer() // Create an answer
      await pc.setLocalDescription(answer) // Set the local description
      console.log("Emitting answer:", answer)
      socket.emit("answer", { roomId, answer: pc.localDescription }) // Send the answer to the backend

      // Start the local camera for the second user
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        console.log("Local Stream (Second User):", stream)
        localStream.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))
      } catch (error) {
        console.error("Error accessing media devices for second user:", error)
      }
    })

    // Listen for incoming answer from server
    socket.on("receive-answer", async (answer) => {
      console.log("Received answer")
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer)) // Set the remote description
        console.log("Remote description set for User 1. Adding queued ICE candidates.")
        while (iceCandidateQueue.length > 0) {
          const candidate = iceCandidateQueue.shift()
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
            console.log("Queued ICE candidate added successfully")
          } catch (error) {
            console.error("Error adding queued ICE candidate:", error)
          }
        }
      } catch (error) {
        console.error("Error setting remote description for User 1:", error)
      }
    })

    return () => {
      pc.close()
      console.log("PeerConnection closed")
      socket.off("receive_offer")
      socket.off("receive-candidate")
      socket.off("receive-answer")
    }
  }, [roomId])

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      console.log("Local Stream:", stream)
      localStream.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream))
      setIsVideoStarted(true)

      // Create an offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      console.log("Emitting offer:", offer) // Log the offer
      socket.emit("offer", { roomId, offer }) // Send the offer to the backend
    } catch (error) {
      console.error("Error accessing media devices or creating an offer:", error)
    }
  }

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const endCall = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
    setIsVideoStarted(false)
    setIsMuted(false)
    // Optionally navigate away or show end call UI
    window.location.href = '/dashboard'
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Remote Stream - Fullscreen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        className="w-full h-full object-cover"
      />

      {/* Local Stream - Small Overlay in the Corner */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        className="absolute bottom-4 right-4 w-32 h-32 bg-gray-800 rounded-md border-2 border-white shadow-lg"
      />

      {/* Control Buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        {!isVideoStarted ? (
          <button
            onClick={startVideo}
            className="bg-blue-600 text-white py-3 px-6 rounded-full hover:bg-blue-700 transition"
          >
            Start Video
          </button>
        ) : (
          <>
            {/* Mute/Unmute Button */}
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition"
            >
              <PhoneOff size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}