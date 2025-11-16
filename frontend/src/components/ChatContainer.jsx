import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import NoConversationPlaceholder from "./NoConversationPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
	const {
		selectedUser,
		getMessagesByUserId,
		messages,
		isMessagesLoading,
		subscribeToMessages,
		unsubscribeFromMessages,
		chatbotMessages,
		isBotTyping,
	} = useChatStore();

	const { authUser } = useAuthStore();
	const messageEndRef = useRef(null);

	const isChatbotSelected = selectedUser?._id === "chatbot-user";

	useEffect(() => {
		if (selectedUser?._id) {
			getMessagesByUserId(selectedUser._id);
			if (!isChatbotSelected) {
				subscribeToMessages();
			}
			return () => unsubscribeFromMessages();
		}
	}, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages, isChatbotSelected]);

	useEffect(() => {
		messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, chatbotMessages, isBotTyping]);

	const chatHasMessages = isChatbotSelected ? chatbotMessages.length > 0 : messages.length > 0;

	const renderMessages = () => {
		const messagesToRender = isChatbotSelected ? chatbotMessages : messages;

		return messagesToRender.map(msg => {
			const isSender = msg.senderId === authUser._id;
			const isBot = msg.senderId === "chatbot-user";

			return (
				<div key={msg._id} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
					<div
						className={`relative px-3 py-2 rounded-lg shadow-sm max-w-xs sm:max-w-sm md:max-w-md break-words text-sm leading-relaxed transition-all duration-150 ${
							isSender
								? "bg-[#005c4b] text-white rounded-br-none hover:bg-[#01694d]"
								: isBot
								? "bg-blue-900/50 text-slate-100 rounded-bl-none hover:bg-blue-800/60 border border-blue-400/30"
								: "bg-[#202c33] text-slate-100 rounded-bl-none hover:bg-[#2a3942]"
						} ${msg.isError ? "bg-red-800/70" : ""}`}
					>
						{msg.image && (
							<img
								src={msg.image}
								alt='Shared'
								className='rounded-md mb-1 w-full max-h-52 object-cover border border-[#2f3b43]'
							/>
						)}

						{msg.text && <p>{msg.text}</p>}

						<p className='text-[10px] text-gray-300 mt-1 text-right opacity-70'>
							{new Date(msg.createdAt).toLocaleTimeString(undefined, {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					</div>
				</div>
			);
		});
	};

	return (
		<div className='flex flex-col h-full bg-[#0b141a]'>
			<ChatHeader />

			<div
				className={`flex-1 px-3 sm:px-5 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-[#0b141a] ${
					chatHasMessages ? "bg-cover bg-center bg-no-repeat" : ""
				}`}
				style={
					chatHasMessages ? { backgroundImage: "url('/chatimage.png')" } : { backgroundColor: "#0b141a" }
				}
			>
				{chatHasMessages ? (
					<div className='max-w-3xl mx-auto space-y-2'>
						{renderMessages()}

						{isBotTyping && (
							<div className='flex justify-start'>
								<div className='relative px-4 py-3 rounded-lg shadow-sm bg-blue-900/50 border border-blue-400/30'>
									<div className='flex items-center gap-2'>
										<span className='w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75' />
										<span className='w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150' />
										<span className='w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300' />
									</div>
								</div>
							</div>
						)}

						<div ref={messageEndRef} />
					</div>
				) : isMessagesLoading ? (
					<MessagesLoadingSkeleton />
				) : selectedUser ? (
					<NoChatHistoryPlaceholder name={selectedUser.fullName} />
				) : (
					<NoConversationPlaceholder />
				)}
			</div>

			{selectedUser && (
				<div className='border-t border-[#2f3b43] bg-[#202c33]'>
					<MessageInput />
				</div>
			)}
		</div>
	);
}

export default ChatContainer;
