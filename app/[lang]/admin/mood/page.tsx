"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { createClient } from "@/utils/supabase/client";
import { getUserRole } from "@/lib/roles";

type MoodRow = {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  view_count: number;
  created_at: string;
};

type MoodForm = {
  title: string;
  description: string;
  video_url: string;
};

const EMPTY_FORM: MoodForm = {
  title: "",
  description: "",
  video_url: "",
};

export default function AdminMoodPage() {
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [moods, setMoods] = useState<MoodRow[]>([]);
  const [form, setForm] = useState<MoodForm>(EMPTY_FORM);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MoodForm>(EMPTY_FORM);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editVideoPreview, setEditVideoPreview] = useState("");
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchMoods = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage({ type: "error", text: "Please sign in to manage moods." });
      setIsLoading(false);
      return;
    }

    const role = await getUserRole(user.id);
    if (role !== "admin") {
      setIsAdmin(false);
      setMessage({ type: "error", text: "Only admins can access mood management." });
      setIsLoading(false);
      return;
    }

    setIsAdmin(true);

    const moodsQuery: any = supabase.from("moods");
    const { data, error } = await moodsQuery
      .select("id, title, description, video_url, view_count, created_at")
      .order("created_at", { ascending: false });

    if (error && error.message.includes("column moods.view_count does not exist")) {
      const { data: fallbackData, error: fallbackError } = await moodsQuery
        .select("id, title, description, video_url, created_at")
        .order("created_at", { ascending: false });

      if (fallbackError) {
        setMessage({ type: "error", text: `Failed to load moods: ${fallbackError.message}` });
        setMoods([]);
      } else {
        const normalized = ((fallbackData || []) as Omit<MoodRow, "view_count">[]).map((mood) => ({
          ...mood,
          view_count: 0,
        }));
        setMoods(normalized);
      }
    } else if (error) {
      setMessage({ type: "error", text: `Failed to load moods: ${error.message}` });
      setMoods([]);
    } else {
      setMoods((data || []) as MoodRow[]);
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchMoods();
  }, [fetchMoods]);


  useEffect(() => {
    if (!videoFile) {
      setVideoPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setVideoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [videoFile]);

  useEffect(() => {
    if (!editVideoFile) {
      setEditVideoPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(editVideoFile);
    setEditVideoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editVideoFile]);

  useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth >= 1280) {
        setCardsPerPage(4);
      } else if (window.innerWidth >= 1024) {
        setCardsPerPage(3);
      } else if (window.innerWidth >= 640) {
        setCardsPerPage(2);
      } else {
        setCardsPerPage(1);
      }
    };

    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);

    return () => {
      window.removeEventListener("resize", updateCardsPerPage);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(moods.length / cardsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedMoods = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return moods.slice(start, start + cardsPerPage);
  }, [moods, currentPage, cardsPerPage]);

  const validateForm = (draft: MoodForm) => {
    if (!draft.title.trim()) return "Title is required.";
    if (!videoFile) return "Video is required.";
    return null;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setVideoFile(null);
    setVideoPreview("");
  };

  const uploadMoodAsset = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      throw new Error("Please choose a valid video file.");
    }

    // File size validation for videos
    const maxSizeMB = 50; // 50MB for videos
    const minSizeKB = 100; // 100KB minimum for videos
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const minSizeBytes = minSizeKB * 1024;

    if (file.size > maxSizeBytes) {
      throw new Error(`Video size exceeds maximum limit of ${maxSizeMB}MB. Please choose a smaller file.`);
    }

    if (file.size < minSizeBytes) {
      throw new Error(`Video size is below minimum limit of ${minSizeKB}KB. Please choose a larger file.`);
    }

    const fileExt = file.name.split(".").pop() || "mp4";
    const filePath = `moods/videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("moods")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      throw new Error(
        `Video upload failed: ${uploadError.message}. Ensure a public storage bucket named "moods" exists.`
      );
    }

    const { data } = supabase.storage.from("moods").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    let videoUrl = "";

    try {
      if (videoFile) {
        videoUrl = await uploadMoodAsset(videoFile);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to upload video file.",
      });
      setIsSaving(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      video_url: videoUrl,
    };

    const moodsQuery: any = supabase.from("moods");

    if (editingId) {
      const { error } = await moodsQuery.update(payload).eq("id", editingId);

      if (error) {
        setMessage({ type: "error", text: `Update failed: ${error.message}` });
      } else {
        setEditingId(null);
        setMessage({ type: "success", text: "Mood updated successfully." });
        await fetchMoods();
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await moodsQuery.insert({
        ...payload,
        created_by: user?.id || null,
      });

      if (error) {
        setMessage({ type: "error", text: `Create failed: ${error.message}` });
      } else {
        setMessage({ type: "success", text: "Mood created successfully." });
        resetForm();
        setCurrentPage(1);
        await fetchMoods();
      }
    }

    setIsSaving(false);
  };

  const startEdit = (mood: MoodRow) => {
    setEditingId(mood.id);
    setEditForm({
      title: mood.title,
      description: mood.description || "",
      video_url: mood.video_url,
    });
    setEditVideoFile(null);
    setEditVideoPreview("");
    setMessage(null);
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditVideoFile(null);
    setEditVideoPreview("");
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    const validationError = validateForm(editForm);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    let videoUrl = editForm.video_url;

    if (editVideoFile) {
      try {
        videoUrl = await uploadMoodAsset(editVideoFile);
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to upload video file.",
        });
        setIsSaving(false);
        return;
      }
    }

    const moodsQuery: any = supabase.from("moods");
    const { error } = await moodsQuery
      .update({
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        video_url: videoUrl,
      })
      .eq("id", editingId);

    if (error) {
      setMessage({ type: "error", text: `Update failed: ${error.message}` });
    } else {
      closeEditModal();
      setMessage({ type: "success", text: "Mood updated successfully." });
      await fetchMoods();
    }

    setIsSaving(false);
  };

  const handleDelete = async (mood: MoodRow) => {
    const confirmed = window.confirm(`Delete mood \"${mood.title}\"?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage(null);

    const moodsQuery: any = supabase.from("moods");
    const { error } = await moodsQuery.delete().eq("id", mood.id);

    if (error) {
      setMessage({ type: "error", text: `Delete failed: ${error.message}` });
    } else {
      if (editingId === mood.id) {
        resetForm();
      }
      setMessage({ type: "success", text: "Mood deleted successfully." });
      await fetchMoods();
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Mood Management" subtitle="Add and edit mood videos" />


      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {!isAdmin && !isLoading ? null : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Add Mood
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter mood title"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter mood description"
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Video</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-[#5b2d8e]"
                />
                <p className="mt-1 text-xs text-slate-500">Upload video file.</p>
              </div>

              <div className="md:col-span-2">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
                  {videoPreview ? (
                    <video
                      src={videoPreview}
                      controls
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center px-3 text-xs text-slate-300">
                      Video preview appears here.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-lg bg-[#5b2d8e] px-4 py-2 text-sm font-medium text-white hover:bg-[#4c2476] disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Create Mood"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">All Moods</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: cardsPerPage }).map((_, index) => (
                  <div
                    key={`mood-skeleton-${index}`}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 h-44 w-full rounded-xl bg-slate-200" />
                    <div className="mb-2 h-5 w-2/3 rounded bg-slate-200" />
                    <div className="mb-2 h-4 w-full rounded bg-slate-100" />
                    <div className="mb-5 h-4 w-1/3 rounded bg-slate-100" />
                    <div className="flex gap-2">
                      <div className="h-8 w-16 rounded-lg bg-slate-200" />
                      <div className="h-8 w-16 rounded-lg bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : moods.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No moods yet.</div>
            ) : (
              <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedMoods.map((mood) => (
                  <div key={mood.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-2">
                      <div className="flex h-44 w-full items-center justify-center rounded-lg bg-black">
                        <video
                          src={mood.video_url}
                          controls
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{mood.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{mood.description || "No description"}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Views: {mood.view_count || 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Created: {new Date(mood.created_at).toLocaleDateString()}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(mood)}
                        disabled={isSaving}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(mood)}
                        disabled={isSaving}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const page = index + 1;
                      const isActive = page === currentPage;

                      return (
                        <button
                          key={`page-${page}`}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-md px-3 py-1.5 text-sm ${
                            isActive
                              ? "bg-[#5b2d8e] text-white"
                              : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              </>
            )}

            {editingId !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-slate-900">Edit Mood</h3>
                    <button
                      type="button"
                      onClick={closeEditModal}
                      disabled={isSaving}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter mood title"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter mood description"
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Replace Video</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setEditVideoFile(e.target.files?.[0] ?? null)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-[#5b2d8e]"
                      />
                      <p className="mt-1 text-xs text-slate-500">Leave empty to keep current video.</p>
                    </div>

                    <div>
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
                        <video
                          src={editVideoPreview || editForm.video_url}
                          controls
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdate()}
                      disabled={isSaving}
                      className="rounded-lg bg-[#5b2d8e] px-3 py-2 text-sm font-medium text-white hover:bg-[#4c2476] disabled:opacity-60"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
