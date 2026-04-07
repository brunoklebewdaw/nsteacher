'use client';

import { useState, useEffect } from 'react';
import { getConversations, getMessagesWithUser, sendMessage, getChatContacts, getNotifications, markNotificationRead, markAllNotificationsRead, createPost, getPosts, deletePost, archivePost } from '@/actions/communication';
import { Send, User, Bell, Pin, Trash2, Archive, Plus, MessageCircle, Megaphone, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  userId: string;
  userName: string;
  userRole: string;
  lastMessage: any;
  unread: number;
}

interface Message {
  id: string;
  content: string;
  from: { id: string; name: string };
  to: { id: string; name: string };
  createdAt: string | Date;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string | Date;
  link?: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  viewCount: number;
  author: { name: string };
  class?: { name: string } | null;
  createdAt: string | Date;
}

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'mural' | 'notifications'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [convs, notifs, psts, conts] = await Promise.all([
        getConversations(),
        getNotifications(),
        getPosts(),
        getChatContacts()
      ]);
      setConversations(convs || []);
      setNotifications(notifs || []);
      setPosts(psts || []);
      setContacts(conts || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSelectConversation(userId: string) {
    setSelectedUser(userId);
    setLoading(true);
    const msgs = await getMessagesWithUser(userId);
    setMessages(msgs || []);
    setLoading(false);
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedUser) return;
    const formData = new FormData();
    formData.append('toId', selectedUser);
    formData.append('content', newMessage);
    await sendMessage(formData);
    setNewMessage('');
    const msgs = await getMessagesWithUser(selectedUser);
    setMessages(msgs || []);
  }

  async function handleCreatePost() {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    const formData = new FormData();
    formData.append('title', newPostTitle);
    formData.append('content', newPostContent);
    if (selectedClass) formData.append('classId', selectedClass);
    await createPost(formData);
    setShowNewPost(false);
    setNewPostTitle('');
    setNewPostContent('');
    loadData();
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    loadData();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    loadData();
  }

  const currentUserId = 'current-user-id';

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <MessageCircle className="w-5 h-5 inline mr-2" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('mural')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'mural' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <Megaphone className="w-5 h-5 inline mr-2" />
          Mural de Avisos
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <Bell className="w-5 h-5 inline mr-2" />
          Notificações
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'chat' && (
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          <div className="w-1/3 bg-white rounded-lg shadow p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-700 mb-4">Conversas</h3>
            {contacts.length === 0 && <p className="text-gray-500 text-sm">Nenhum contato disponível</p>}
            {contacts.map((contact) => {
              const conv = conversations.find(c => c.userId === contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => handleSelectConversation(contact.id)}
                  className={`w-full p-3 rounded-lg text-left mb-2 ${selectedUser === contact.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.class || 'Aluno'}</p>
                    </div>
                    {conv?.unread && conv.unread > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{conv.unread}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Chat com {contacts.find(c => c.id === selectedUser)?.name}</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.from.id === 'current-user-id';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Selecione uma conversa para começar
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mural' && (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-semibold">Mural de Avisos</h3>
            <button
              onClick={() => setShowNewPost(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Publicação
            </button>
          </div>

          {showNewPost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-semibold">Nova Publicação</h3>
                  <button onClick={() => setShowNewPost(false)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Título"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                />
                <textarea
                  placeholder="Conteúdo do aviso..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg mb-4 h-32"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowNewPost(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    Cancelar
                  </button>
                  <button onClick={handleCreatePost} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {posts.length === 0 && <p className="text-gray-500">Nenhuma publicação ainda.</p>}
            {posts.map((post) => (
              <div key={post.id} className={`bg-white rounded-lg shadow p-6 ${post.isPinned ? 'border-l-4 border-yellow-500' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    {post.isPinned && <span className="text-yellow-600 text-sm flex items-center gap-1 mb-2"><Pin className="w-4 h-4" /> Fixado</span>}
                    <h4 className="text-lg font-semibold text-gray-800">{post.title}</h4>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">{post.content}</p>
                    <div className="mt-3 text-sm text-gray-500">
                      Por {post.author.name} • {formatDistanceToNow(new Date(post.createdAt), { locale: ptBR })} atrás • {post.viewCount} visualizações
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-semibold">Notificações</h3>
            {notifications.some(n => !n.isRead) && (
              <button onClick={handleMarkAllRead} className="text-blue-600 hover:text-blue-700 text-sm">
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 && <p className="text-gray-500">Nenhuma notificação.</p>}
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                className={`p-4 rounded-lg cursor-pointer ${notif.isRead ? 'bg-gray-50' : 'bg-white shadow border-l-4 border-blue-500'}`}
              >
                <div className="flex items-start gap-3">
                  <Bell className={`w-5 h-5 mt-0.5 ${notif.type === 'warning' ? 'text-yellow-500' : notif.type === 'alert' ? 'text-red-500' : 'text-blue-500'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{notif.title}</p>
                    <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                    <p className="text-gray-400 text-xs mt-2">{formatDistanceToNow(new Date(notif.createdAt), { locale: ptBR })} atrás</p>
                  </div>
                  {!notif.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}