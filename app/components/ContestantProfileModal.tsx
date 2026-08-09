"use client";

import { useState } from "react";
import { X, Download, Loader2, Trophy } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { renderFlyer, downloadDataUrl, DEFAULT_FLYER_CONFIG, FlyerConfig } from "../lib/flyer";

export interface ProfileContestant {
  id: number;
  name: string;
  stage_name?: string | null;
  contestant_number?: string | null;
  gender: 'male' | 'female';
  division?: 'senior' | 'junior' | 'primary';
  category?: string;
  class?: string | null;
  age?: number | null;
  hometown?: string | null;
  religion?: string | null;
  nationality?: string | null;
  state_of_origin?: string | null;
  favourite_subject?: string | null;
  role_model?: string | null;
  dream_career?: string | null;
  talent?: string | null;
  representing?: string | null;
  bio?: string | null;
  achievements?: string[] | null;
  favourite_food?: string | null;
  favourite_drink?: string | null;
  favourite_music_genre?: string | null;
  favourite_movie_tv_show?: string | null;
  favourite_book?: string | null;
  fun_facts?: string | null;
  avatar_url?: string | null;
  gallery_images?: string[] | null;
}

function pageantTitle(division: string | undefined, gender: 'male' | 'female'): string {
  if (division === 'senior') return gender === 'male' ? 'Mr. MTIS' : 'Miss MTIS';
  if (division === 'junior') return gender === 'male' ? 'Prince MTIS' : 'Princess MTIS';
  if (division === 'primary') return gender === 'male' ? 'Little Star Prince' : 'Little Star Princess';
  return gender === 'male' ? 'Male Contestant' : 'Female Contestant';
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="border-b border-gray-100 py-2 last:border-0">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default function ContestantProfileModal({ contestant, onClose }: { contestant: ProfileContestant; onClose: () => void }) {
  const images = [contestant.avatar_url, ...(contestant.gallery_images || [])].filter(Boolean) as string[];
  const [activeImage, setActiveImage] = useState(images[0] || "");
  const [generatingFlyer, setGeneratingFlyer] = useState(false);
  const [flyerError, setFlyerError] = useState<string | null>(null);

  const initials = contestant.name?.split(' ').map((n) => n[0]).join('') || "?";

  const handleDownloadFlyer = async () => {
    setFlyerError(null);
    setGeneratingFlyer(true);
    try {
      const { data: template, error } = await supabase
        .from('flyer_templates')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!template) {
        setFlyerError("No flyer template has been set up yet. Ask the admin to create one.");
        return;
      }

      const config: FlyerConfig = { ...DEFAULT_FLYER_CONFIG, ...(template.config || {}) };
      const dataUrl = await renderFlyer(
        template.background_image_url,
        template.canvas_width,
        template.canvas_height,
        config,
        contestant
      );
      downloadDataUrl(dataUrl, `${(contestant.stage_name || contestant.name).replace(/\s+/g, '-')}-flyer.png`);
    } catch (err: any) {
      setFlyerError(err.message || "Failed to generate flyer.");
    } finally {
      setGeneratingFlyer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header image */}
        <div className="relative h-64 bg-gradient-to-r from-mtis-blue to-mtis-wine rounded-t-2xl overflow-hidden">
          {activeImage ? (
            <img src={activeImage} alt={contestant.name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-white/80">{initials}</div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition">
            <X size={20} />
          </button>
          <div className="absolute bottom-3 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium">
            {pageantTitle(contestant.division, contestant.gender)}
            {contestant.contestant_number ? ` · #${contestant.contestant_number}` : ""}
          </div>
        </div>

        {/* Gallery thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 px-6 pt-4">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${activeImage === img ? 'border-mtis-gold' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img src={img} alt={`${contestant.name} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{contestant.name}</h2>
              {contestant.stage_name && <p className="text-mtis-wine font-medium">"{contestant.stage_name}"</p>}
              {contestant.representing && <p className="text-sm text-gray-500">{contestant.representing}</p>}
            </div>
            <button
              onClick={handleDownloadFlyer}
              disabled={generatingFlyer}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mtis-blue text-white rounded-xl text-sm font-medium hover:bg-mtis-blue/90 transition disabled:opacity-60"
            >
              {generatingFlyer ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download Flyer
            </button>
          </div>

          {flyerError && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
              {flyerError}
            </div>
          )}

          {contestant.bio && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-1">Bio</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{contestant.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 mb-4">
            <InfoRow label="Class" value={contestant.class} />
            <InfoRow label="Age" value={contestant.age != null ? String(contestant.age) : null} />
            <InfoRow label="Gender" value={contestant.gender === 'male' ? 'Male' : 'Female'} />
            <InfoRow label="Religion" value={contestant.religion} />
            <InfoRow label="Nationality" value={contestant.nationality} />
            <InfoRow label="State of Origin" value={contestant.state_of_origin} />
            <InfoRow label="Hometown" value={contestant.hometown} />
            <InfoRow label="Favourite Subject" value={contestant.favourite_subject} />
            <InfoRow label="Role Model" value={contestant.role_model} />
            <InfoRow label="Dream Career" value={contestant.dream_career} />
            <InfoRow label="Talents" value={contestant.talent} />
            <InfoRow label="Favourite Food" value={contestant.favourite_food} />
            <InfoRow label="Favourite Drink" value={contestant.favourite_drink} />
            <InfoRow label="Favourite Music Genre" value={contestant.favourite_music_genre} />
            <InfoRow label="Favourite Movie/TV Show" value={contestant.favourite_movie_tv_show} />
            <InfoRow label="Favourite Book" value={contestant.favourite_book} />
          </div>

          {contestant.fun_facts && (
            <div className="mb-4 rounded-xl bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">Fun Facts</h3>
              <p className="text-sm text-gray-600">{contestant.fun_facts}</p>
            </div>
          )}

          {contestant.achievements && contestant.achievements.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1"><Trophy size={14} className="text-mtis-gold" /> Awards & Achievements</h3>
              <div className="flex flex-wrap gap-2">
                {contestant.achievements.map((ach, idx) => (
                  <span key={idx} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">🏆 {ach}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
