import React, { useState } from 'react';
import { 
  BellRing, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  Eye,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { NotificationLog, NotificationTemplate, Student } from '../types';
import { soundFx } from '../utils/audio';

interface ParentNotificationCenterProps {
  notificationLogs: NotificationLog[];
  templates: NotificationTemplate[];
  students: Student[];
  onSendBroadcast: (targetGroup: string, subject: string, body: string, channel: 'push' | 'email' | 'sms') => void;
  soundEnabled: boolean;
}

export const ParentNotificationCenter: React.FC<ParentNotificationCenterProps> = ({
  notificationLogs,
  templates,
  students,
  onSendBroadcast,
  soundEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'composer' | 'templates'>('stream');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchLogQuery, setSearchLogQuery] = useState<string>('');
  
  // Composer Form state
  const [broadcastTarget, setBroadcastTarget] = useState<string>('All Parents');
  const [broadcastChannel, setBroadcastChannel] = useState<'push' | 'email' | 'sms'>('push');
  const [broadcastSubject, setBroadcastSubject] = useState<string>('📢 School Notice: Heritage Inter-House Sports & Mid-Term Dates');
  const [broadcastBody, setBroadcastBody] = useState<string>(
    'Dear Heritage Parents & Guardians, please be informed that our Annual Inter-House Sports Festival will hold this Friday at 08:00 AM. Attendance is mandatory for all students.'
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');

  // Mobile Phone Mockup active push notification
  const latestPush = notificationLogs.find((l) => l.channel === 'Mobile Push') || notificationLogs[0];

  const filteredLogs = notificationLogs.filter((log) => {
    const matchesChannel =
      selectedChannel === 'all' ||
      (selectedChannel === 'push' && log.channel === 'Mobile Push') ||
      (selectedChannel === 'email' && log.channel === 'Email') ||
      (selectedChannel === 'sms' && log.channel.includes('SMS'));

    const matchesQuery =
      log.recipientName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.recipientContact.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      (log.studentOrStaffName && log.studentOrStaffName.toLowerCase().includes(searchLogQuery.toLowerCase()));

    return matchesChannel && matchesQuery;
  });

  const handleApplyTemplate = (tmplId: string) => {
    const tmpl = templates.find((t) => t.id === tmplId);
    if (!tmpl) return;
    setBroadcastSubject(tmpl.subject.replace('{STUDENT_NAME}', 'Zainab Aliyu').replace('{MONTH_YEAR}', 'August 2026'));
    setBroadcastBody(
      tmpl.body
        .replace('{PARENT_NAME}', 'Esteemed Parent')
        .replace('{STUDENT_NAME}', 'Zainab Aliyu')
        .replace('{TIME}', '07:30 AM')
        .replace('{DATE}', '16th August 2026')
        .replace('{CLASS}', 'SS 3 Science Platinum')
        .replace('{GATE_LOCATION}', 'Main Gate (Maitama)')
    );
    setBroadcastChannel(tmpl.channel);
  };

  const handleDispatchBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastBody) return;

    if (soundEnabled) soundFx.playNotificationPing();
    onSendBroadcast(broadcastTarget, broadcastSubject, broadcastBody, broadcastChannel);
    alert(`Broadcast dispatched via ${broadcastChannel.toUpperCase()} to ${broadcastTarget}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-indigo-700" />
            <span>Parent Communication & Real-time Notification Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Instant mobile push notifications, email dispatch templates, and SMS alerts for Abuja families.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stream'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Live Logs & Stream
          </button>
          <button
            onClick={() => setActiveTab('composer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'composer'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Broadcast Composer
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Main Grid: Stream & Phone Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Stream / Composer based on activeTab */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'stream' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchLogQuery}
                    onChange={(e) => setSearchLogQuery(e.target.value)}
                    placeholder="Search parent name, phone, message..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Channel:</span>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="all">All Channels</option>
                    <option value="push">Mobile Push</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS / WhatsApp</option>
                  </select>
                </div>
              </div>

              {/* Live Notifications Stream List */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredLogs.map((log) => {
                  const isPush = log.channel === 'Mobile Push';
                  const isEmail = log.channel === 'Email';

                  return (
                    <div
                      key={log.id}
                      className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl hover:border-indigo-300 transition-colors space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`p-2 rounded-xl shadow-2xs ${
                              isPush
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : isEmail
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isPush ? (
                              <Smartphone className="w-4 h-4" />
                            ) : isEmail ? (
                              <Mail className="w-4 h-4" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </span>

                          <div>
                            <span className="text-xs font-bold text-slate-900">{log.recipientName}</span>
                            <span className="text-[11px] text-slate-500 ml-1.5 font-mono font-medium">
                              ({log.recipientContact})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                            ✓ {log.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-medium">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-indigo-900">{log.subject}</p>
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-normal">
                        {log.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'composer' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-700" />
                  <span>Compose Direct School Broadcast / Emergency Dispatch</span>
                </h3>
              </div>

              <form onSubmit={handleDispatchBroadcast} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Target Recipient Group</label>
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                    >
                      <option value="All Parents">All Parents & Guardians (Full School)</option>
                      <option value="SS 3 Parents">SS 3 Parents (Graduating Class)</option>
                      <option value="SS 1 & SS 2 Parents">Senior Secondary Parents</option>
                      <option value="Junior Secondary Parents">Junior Secondary (JSS 1-3)</option>
                      <option value="Primary School Parents">Primary & Early Years Parents</option>
                      <option value="Bus Route A & B Parents">School Bus Route Parents</option>
                      <option value="All Faculty & Staff">All Faculty & Staff Members</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Delivery Channel</label>
                    <select
                      value={broadcastChannel}
                      onChange={(e) => setBroadcastChannel(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                    >
                      <option value="push">Instant Mobile Push Notification (High Priority)</option>
                      <option value="email">Official Email Broadcast (Letterhead format)</option>
                      <option value="sms">SMS / WhatsApp Gateway (Abuja Mobile)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Subject / Headline *</label>
                  <input
                    type="text"
                    required
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="Enter broadcast headline..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Message Body *</label>
                  <textarea
                    rows={6}
                    required
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Type official notification message..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none leading-relaxed font-normal"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Real-time delivery to Nigerian mobile networks (MTN, Airtel, Glo)</span>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Broadcast Now</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm">System Communication Templates</h3>
              <p className="text-xs text-slate-500 font-medium">
                Pre-configured triggers executed when students scan at gates or during morning roll-call.
              </p>

              <div className="space-y-3">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{tmpl.title}</h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] uppercase font-black border border-amber-200">
                        {tmpl.channel}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-indigo-900">{tmpl.subject}</p>
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed">
                      {tmpl.body}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
                      <span>Variables: {tmpl.variables.join(', ')}</span>
                      <button
                        onClick={() => {
                          handleApplyTemplate(tmpl.id);
                          setActiveTab('composer');
                        }}
                        className="text-indigo-700 hover:text-indigo-900 font-bold"
                      >
                        Use in Composer →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Interactive Parent Smartphone Mockup */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-[320px] bg-slate-900 rounded-[40px] p-3.5 border-4 border-slate-300 shadow-2xl relative">
            {/* Phone Speaker & Camera Island */}
            <div className="w-28 h-5 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700 mr-2" />
              <div className="w-8 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Phone Screen Area */}
            <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 rounded-[28px] p-4 min-h-[520px] flex flex-col justify-between border border-indigo-800/80 relative overflow-hidden">
              {/* Phone Status Bar */}
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-300 mb-4 px-1">
                <span>08:15</span>
                <span className="text-[10px] font-mono">MTN-NG 5G • 98%</span>
              </div>

              {/* Lock Screen Time */}
              <div className="text-center my-4">
                <span className="text-4xl font-light text-white font-mono tracking-tight">08:15</span>
                <p className="text-xs text-indigo-200 mt-1 font-medium">Sunday, 16 August</p>
              </div>

              {/* Active Incoming Push Notification Card */}
              <div className="space-y-3 my-auto">
                <div className="bg-white/95 backdrop-blur-xl border border-amber-400 rounded-2xl p-3.5 shadow-2xl space-y-2 animate-pulse hover:border-amber-500 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-950 flex items-center justify-center text-amber-400 font-serif font-black text-xs">
                        HE
                      </div>
                      <span className="text-[11px] font-black text-slate-900">HERITAGE ACADEMY</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono font-bold">Now</span>
                  </div>

                  <p className="text-xs font-black text-indigo-950">
                    {latestPush ? latestPush.subject : '🎓 Heritage Alert: Student Checked In'}
                  </p>
                  <p className="text-[11px] text-slate-700 leading-snug font-medium">
                    {latestPush
                      ? latestPush.body
                      : 'Zainab Aliyu Bello checked in at Main Gate at 07:22 AM. Class: SS 3 Science Platinum.'}
                  </p>
                </div>
              </div>

              {/* Bottom App Quick Launchers */}
              <div className="pt-4 border-t border-indigo-900/60 flex items-center justify-around text-slate-400">
                <div className="w-10 h-10 rounded-full bg-indigo-900/80 border border-indigo-700 flex items-center justify-center text-amber-400">
                  <BellRing className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-900/80 border border-indigo-700 flex items-center justify-center text-emerald-400">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
          </div>
          <p className="text-[11px] text-slate-500 font-bold mt-2 text-center">
            Interactive Parent Smartphone Push Preview
          </p>
        </div>
      </div>
    </div>
  );
};
