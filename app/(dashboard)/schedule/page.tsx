// app/(dashboard)/schedule/page.tsx
"use client";

import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import { Calendar, Clock, MapPin, Users, Mic, Globe, Crown, Loader2, RefreshCw, AlertCircle } from "lucide-react";

// Types
interface ScheduleEvent {
  id: number;
  day: string;
  date: string;
  time: string;
  name: string;
  location: string;
  icon_name: string;
  description: string;
  order?: number;
  is_active: boolean;
}

interface DaySchedule {
  day: string;
  date: string;
  events: ScheduleEvent[];
}

// Icon mapping
const iconMap: Record<string, any> = {
  Users: Users,
  Mic: Mic,
  Globe: Globe,
  Crown: Crown,
};

// Helper function to get icon component
const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Calendar;
};

export default function SchedulePage() {
  const [scheduleEvents, setScheduleEvents] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load schedule from Supabase
  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch events from database
      const { data: events, error: eventsError } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('is_active', true);

      if (eventsError) throw eventsError;

      if (events && events.length > 0) {
        // Group events by day
        const groupedEvents: Record<string, DaySchedule> = {};
        
        events.forEach((event: ScheduleEvent) => {
          if (!groupedEvents[event.day]) {
            groupedEvents[event.day] = {
              day: event.day,
              date: event.date,
              events: []
            };
          }
          groupedEvents[event.day].events.push(event);
        });

        // Sort events inside each day by order, then time, then id
        const scheduleArray = Object.values(groupedEvents).map((daySchedule) => ({
          ...daySchedule,
          events: daySchedule.events.sort((a, b) => {
            const orderA = a.order ?? 0;
            const orderB = b.order ?? 0;

            if (orderA !== orderB) return orderA - orderB;
            if (a.time !== b.time) return a.time.localeCompare(b.time);
            return a.id - b.id;
          }),
        }));
        
        // Sort days (Day 1, Day 2, Day 3...)
        scheduleArray.sort((a, b) => {
          const dayNumA = parseInt(a.day.split(' ')[1]) || 0;
          const dayNumB = parseInt(b.day.split(' ')[1]) || 0;
          return dayNumA - dayNumB;
        });

        setScheduleEvents(scheduleArray);
        setLastUpdated(new Date());
      } else {
        // Use fallback data if no events in database
        setScheduleEvents(getFallbackSchedule());
      }
    } catch (error: any) {
      console.error("Error loading schedule:", error);
      setError(error?.message || String(error));
      // Use fallback data on error
      setScheduleEvents(getFallbackSchedule());
    } finally {
      setLoading(false);
    }
  };

  // Fallback schedule data (in case database is empty)
  const getFallbackSchedule = (): DaySchedule[] => {
    return [
      {
        day: "Day 1",
        date: "December 22, 2026",
        events: [
          {
            id: 1,
            day: "Day 1",
            date: "December 22, 2026",
            time: "8:00 AM - 10:00 AM",
            name: "Formal Introduction",
            location: "Main Stage",
            icon_name: "Users",
            description: "Official introduction of all contestants",
            order: 1,
            is_active: true,
          },
          {
            id: 2,
            day: "Day 1",
            date: "December 22, 2026",
            time: "10:00 AM - 12:00 PM",
            name: "Casual Wear Competition",
            location: "Runway Area",
            icon_name: "Mic",
            description: "Contestants showcase casual fashion & personality",
            order: 2,
            is_active: true,
          },
          {
            id: 3,
            day: "Day 1",
            date: "December 22, 2026",
            time: "1:00 PM - 4:00 PM",
            name: "Talent Showcase",
            location: "Main Stage",
            icon_name: "Mic",
            description: "Singing, dancing, comedy, spoken word, and unique talents",
            order: 3,
            is_active: true,
          },
          {
            id: 4,
            day: "Day 1",
            date: "December 22, 2026",
            time: "4:00 PM - 5:00 PM",
            name: "Impromptu Speeches",
            location: "Main Stage",
            icon_name: "Mic",
            description: "1-2 minute impromptu speeches on random topics",
            order: 4,
            is_active: true,
          },
        ],
      },
      {
        day: "Day 2",
        date: "December 23, 2026",
        events: [
          {
            id: 5,
            day: "Day 2",
            date: "December 23, 2026",
            time: "9:00 AM - 12:00 PM",
            name: "Native Wear Competition",
            location: "Runway Area",
            icon_name: "Globe",
            description: "Cultural runway introduction",
            order: 5,
            is_active: true,
          },
          {
            id: 6,
            day: "Day 2",
            date: "December 23, 2026",
            time: "1:00 PM - 3:00 PM",
            name: "Cultural Interview Round",
            location: "Interview Room",
            icon_name: "Globe",
            description: "Questions on heritage, values, and cultural knowledge",
            order: 6,
            is_active: true,
          },
          {
            id: 7,
            day: "Day 2",
            date: "December 23, 2026",
            time: "3:00 PM - 4:00 PM",
            name: "Cultural Speech",
            location: "Main Stage",
            icon_name: "Globe",
            description: "Short cultural speech or proverb explanation",
            order: 7,
            is_active: true,
          },
        ],
      },
      {
        day: "Day 3",
        date: "December 24, 2026",
        events: [
          {
            id: 8,
            day: "Day 3",
            date: "December 24, 2026",
            time: "6:00 PM - 7:00 PM",
            name: "Formal Evening Wear",
            location: "Grand Ballroom",
            icon_name: "Crown",
            description: "Evening gown/suit runway walk",
            order: 8,
            is_active: true,
          },
          {
            id: 9,
            day: "Day 3",
            date: "December 24, 2026",
            time: "7:00 PM - 8:00 PM",
            name: "Top 5 Selection",
            location: "Grand Ballroom",
            icon_name: "Crown",
            description: "Announcement of finalists",
            order: 9,
            is_active: true,
          },
          {
            id: 10,
            day: "Day 3",
            date: "December 24, 2026",
            time: "8:00 PM - 9:00 PM",
            name: "Final Interview",
            location: "Grand Ballroom",
            icon_name: "Crown",
            description: "Leadership and emotional intelligence questions",
            order: 10,
            is_active: true,
          },
          {
            id: 11,
            day: "Day 3",
            date: "December 24, 2026",
            time: "9:00 PM - 10:00 PM",
            name: "Coronation Night",
            location: "Grand Ballroom",
            icon_name: "Crown",
            description: "Crowning of Mr. & Mrs. MTIS 2026",
            order: 11,
            is_active: true,
          },
        ],
      },
    ];
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-mtis-gold mx-auto mb-4" />
            <p className="text-gray-500">Loading schedule...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="mb-2 text-2xl font-bold text-mtis-blue sm:text-3xl">Event Schedule</h1>
                <p className="text-gray-500">Mr. & Mrs. MTIS 2026 - Complete timeline</p>
                {lastUpdated && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last updated: {lastUpdated.toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={loadSchedule}
                className="p-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
              >
                <RefreshCw size={18} className="text-gray-400" />
                <span className="text-sm text-gray-500">Refresh</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-yellow-500" />
              <div>
                <p className="text-sm text-yellow-700">Using fallback schedule data</p>
                <p className="text-xs text-yellow-600">{error}</p>
              </div>
            </div>
          )}

          {/* Schedule Timeline */}
          <div className="space-y-8">
            {scheduleEvents.map((day, dayIdx) => (
              <div key={dayIdx} className="relative">
                {/* Day Header */}
                <div className="sticky top-0 z-10 bg-white rounded-2xl p-4 shadow-sm mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-mtis-blue">{day.day}</h2>
                      <p className="text-sm text-gray-500">{day.date}</p>
                    </div>
                    <Calendar size={24} className="text-mtis-gold" />
                  </div>
                </div>

                {/* Events Timeline */}
                <div className="space-y-4">
                  {day.events.map((event, eventIdx) => {
                    const IconComponent = getIconComponent(event.icon_name);
                    return (
                      <div key={event.id} className="group relative ml-5 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:ml-8 sm:p-5">
                        {/* Timeline connector */}
                        {eventIdx !== day.events.length - 1 && (
                          <div className="absolute left-[-24px] top-12 w-0.5 h-full bg-mtis-gold/20"></div>
                        )}
                        <div className="absolute left-[-32px] top-5 w-4 h-4 rounded-full bg-mtis-gold group-hover:scale-125 transition"></div>
                        
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mtis-blue/10 to-mtis-wine/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                            <IconComponent size={24} className="text-mtis-blue" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 flex flex-col flex-wrap justify-between gap-2 sm:flex-row sm:items-start">
                              <h3 className="font-semibold text-gray-800">{event.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />
                                <span>{event.time}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                              <MapPin size={12} />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Voting Categories Info */}
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-mtis-blue mb-4">Voting Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl hover:shadow-md transition">
                <p className="font-semibold text-gray-800">Most Talented Contestant</p>
                <p className="text-xs text-gray-500 mt-1">Based on Talent Showcase performance</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:shadow-md transition">
                <p className="font-semibold text-gray-800">Best Speaker Round</p>
                <p className="text-xs text-gray-500 mt-1">Based on Impromptu Speeches</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:shadow-md transition">
                <p className="font-semibold text-gray-800">Best Cultural Representation</p>
                <p className="text-xs text-gray-500 mt-1">Based on Native Wear & Cultural Interview</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:shadow-md transition">
                <p className="font-semibold text-gray-800">Most Elegant Contestant</p>
                <p className="text-xs text-gray-500 mt-1">Based on Formal Evening Wear</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:shadow-md transition">
                <p className="font-semibold text-gray-800">People's Choice Award</p>
                <p className="text-xs text-gray-500 mt-1">Overall fan favorite - Grand Finale</p>
              </div>
            </div>
          </div>

          {/* Note about schedule */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Schedule is subject to change. Please check back for updates.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
