"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Upload, X, ArrowLeft, Plus } from "lucide-react";
import { fileToDataUrl } from "../lib/flyer";

interface FormState {
  name: string;
  stageName: string;
  contestantNumber: string;
  gender: 'male' | 'female';
  division: 'senior' | 'junior' | 'primary';
  category: 'Runway' | 'Talent Showcase';
  class: string;
  age: string;
  hometown: string;
  representing: string;
  religion: string;
  nationality: string;
  stateOfOrigin: string;
  favouriteSubject: string;
  roleModel: string;
  dreamCareer: string;
  talent: string;
  favouriteFood: string;
  favouriteDrink: string;
  favouriteMusicGenre: string;
  favouriteMovieTvShow: string;
  favouriteBook: string;
  funFacts: string;
  bio: string;
}

const INITIAL_STATE: FormState = {
  name: "", stageName: "", contestantNumber: "", gender: "male", division: "senior",
  category: "Runway", class: "", age: "", hometown: "", representing: "",
  religion: "", nationality: "", stateOfOrigin: "", favouriteSubject: "", roleModel: "",
  dreamCareer: "", talent: "", favouriteFood: "", favouriteDrink: "", favouriteMusicGenre: "",
  favouriteMovieTvShow: "", favouriteBook: "", funFacts: "", bio: "",
};

const FIELD_LABELS: Partial<Record<keyof FormState, string>> = {
  class: "Class", hometown: "Hometown", representing: "Representing (House, etc.)",
  religion: "Religion", nationality: "Nationality", stateOfOrigin: "State of Origin",
  favouriteSubject: "Favourite Subject", roleModel: "Role Model", dreamCareer: "Dream Career",
  talent: "Talent(s)", favouriteFood: "Favourite Food", favouriteDrink: "Favourite Drink",
  favouriteMusicGenre: "Favourite Music Genre", favouriteMovieTvShow: "Favourite Movie/TV Show",
  favouriteBook: "Favourite Book",
};

const SIMPLE_FIELDS: Array<keyof FormState> = [
  "class", "hometown", "representing", "religion", "nationality", "stateOfOrigin",
  "favouriteSubject", "roleModel", "dreamCareer", "talent",
  "favouriteFood", "favouriteDrink", "favouriteMusicGenre", "favouriteMovieTvShow", "favouriteBook",
];

const MAX_GALLERY = 3;

export default function RegisterContestantPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [profilePicture, setProfilePicture] = useState<{ file: File; preview: string } | null>(null);
  const [gallery, setGallery] = useState<{ file: File; preview: string }[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = (field: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleProfilePicture = async (file: File | undefined) => {
    if (!file) return;
    const preview = await fileToDataUrl(file);
    setProfilePicture({ file, preview });
  };

  const handleGalleryAdd = async (file: File | undefined) => {
    if (!file || gallery.length >= MAX_GALLERY) return;
    const preview = await fileToDataUrl(file);
    setGallery((prev) => [...prev, { file, preview }]);
  };

  const removeGalleryImage = (idx: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAchievement = () => {
    const trimmed = achievementInput.trim();
    if (trimmed) {
      setAchievements((prev) => [...prev, trimmed]);
      setAchievementInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!profilePicture) {
      setError("A profile picture is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contestants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: form.age ? Number(form.age) : null,
          achievements,
          profilePicture: profilePicture.preview,
          galleryImages: gallery.map((g) => g.preview),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Registration Submitted!</h1>
          <p className="text-gray-500 mb-6">
            Thanks for registering. Your profile is now pending review by the pageant admin team — once approved, it will appear on the voting pages.
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-mtis-blue text-white rounded-xl font-medium hover:bg-mtis-blue/90 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-mtis-blue mb-6 transition">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-mtis-blue mb-1">Contestant Registration</h1>
          <p className="text-gray-500 text-sm mb-6">
            Fill in your details below. Your submission will be reviewed by the admin team before it appears publicly.
          </p>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Profile Picture *</h2>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                  {profilePicture ? (
                    <img src={profilePicture.preview} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={24} className="text-gray-300" />
                  )}
                </div>
                <label className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200 transition">
                  {profilePicture ? "Change Photo" : "Upload Photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleProfilePicture(e.target.files?.[0])} />
                </label>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-1">Gallery (up to {MAX_GALLERY} photos)</h2>
              <p className="text-xs text-gray-400 mb-3">Optional extra photos shown on your profile.</p>
              <div className="flex flex-wrap gap-3">
                {gallery.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={img.preview} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {gallery.length < MAX_GALLERY && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                    <Plus size={20} className="text-gray-400" />
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleGalleryAdd(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </div>

            {/* Core Info */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Basic Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stage Name</label>
                  <input value={form.stageName} onChange={(e) => update('stageName', e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contestant Number</label>
                  <input value={form.contestantNumber} onChange={(e) => update('contestantNumber', e.target.value)} placeholder="e.g. 07" className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input type="number" min="1" value={form.age} onChange={(e) => update('age', e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="w-full px-4 py-2 border rounded-xl">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Division</label>
                  <select value={form.division} onChange={(e) => update('division', e.target.value)} className="w-full px-4 py-2 border rounded-xl">
                    <option value="senior">Senior (Mr./Miss MTIS)</option>
                    <option value="junior">Junior (Prince/Princess MTIS)</option>
                    <option value="primary">Primary (Little Star Prince/Princess)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pageant Category</label>
                  <select value={form.category} onChange={(e) => update('category', e.target.value)} className="w-full px-4 py-2 border rounded-xl">
                    <option value="Runway">Runway</option>
                    <option value="Talent Showcase">Talent Showcase</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Detailed Info */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">More About You</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SIMPLE_FIELDS.map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1">{FIELD_LABELS[field]}</label>
                    <input value={form[field]} onChange={(e) => update(field, e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Awards & Achievements</h2>
              <div className="flex gap-2 mb-3">
                <input
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAchievement(); } }}
                  placeholder="e.g. Debate Team Captain"
                  className="flex-1 px-4 py-2 border rounded-xl"
                />
                <button type="button" onClick={addAchievement} className="px-4 py-2 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {achievements.map((ach, idx) => (
                  <span key={idx} className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full flex items-center gap-1">
                    🏆 {ach}
                    <button type="button" onClick={() => setAchievements((prev) => prev.filter((_, i) => i !== idx))}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Fun facts + bio */}
            <div>
              <label className="block text-sm font-medium mb-1">Fun Facts</label>
              <textarea rows={2} value={form.funFacts} onChange={(e) => update('funFacts', e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea rows={4} value={form.bio} onChange={(e) => update('bio', e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-mtis-gold to-amber-500 text-mtis-blue font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
