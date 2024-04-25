import { useToast } from '@apideck/components';
import { ChatCompletionRequestMessage } from 'openai';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { sendMessage } from './sendMessage';

interface ContextProps {
  messages: ChatCompletionRequestMessage[];
  addMessage: (content: string) => Promise<void>;
  isLoadingAnswer: boolean;
}

export const ChatsContext = createContext<Partial<ContextProps>>({});

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([]);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  useEffect(() => {
    const initializeChat = () => {
      const systemMessage: ChatCompletionRequestMessage = {
        role: 'system',
        content: 'You are ChatGPT, a large language model trained by OpenAI.',
      };
      const welcomeMessage: ChatCompletionRequestMessage = {
        role: 'assistant',
        content: 'Hi, How can I help you today?',
      };
      setMessages([systemMessage, welcomeMessage]);
    };

    if (!messages?.length) {
      initializeChat();
    }
  }, [messages?.length, setMessages]);

  const addMessage = async (content: string) => {
    setIsLoadingAnswer(true);
    try {
      const newMessage: ChatCompletionRequestMessage = {
        role: 'user',
        content,
      };
      const newMessages = [...messages, newMessage];
      setMessages(newMessages);
      const response = await sendMessage(newMessages);
      const reply = response?.data?.choices[0]?.message;
      if (reply) {
        setMessages([...newMessages, reply]);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      addToast({ title: 'An error occurred', type: 'error' });
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  return (
    <ChatsContext.Provider value={{ messages, addMessage, isLoadingAnswer }}>
      {children}
    </ChatsContext.Provider>
  );
}


export const useMessages = () => {
  return useContext(ChatsContext) as ContextProps;
};
