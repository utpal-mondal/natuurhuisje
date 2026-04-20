"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { createClient } from "@/utils/supabase/client";
import { getUserRole } from "@/lib/roles";

type DestinationRow = {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  view_count: number;
  created_at: string;
};

type DestinationForm = {
  title: string;
  description: string;
  video_url: string;
};

const EMPTY_FORM: DestinationForm = {
  title: "",
  description: "",
  video_url: "",
};

export default function AdminDestinationPage() {
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [form, setForm] = useState<DestinationForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DestinationForm>(EMPTY_FORM);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchDestinations = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Use session instead of getUser to avoid lock contention
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setMessage({ type: "error", text: "Please sign in to manage destinations." });
        setIsLoading(false);
        return;
      }

      const role = await getUserRole(session.user.id);
      if (role !== "admin") {
        setIsAdmin(false);
        setMessage({ type: "error", text: "Only admins can access destination management." });
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);

    const destinationsQuery: any = supabase.from("destinations");
    const { data, error } = await destinationsQuery
      .select("id, title, description, video_url, view_count, created_at")
      .order("created_at", { ascending: false });

    if (error && error.message.includes("column destinations.view_count does not exist")) {
      const { data: fallbackData, error: fallbackError } = await destinationsQuery
        .select("id, title, description, video_url, created_at")
        .order("created_at", { ascending: false });

      if (fallbackError) {
        setMessage({ type: "error", text: `Failed to load destinations: ${fallbackError.message}` });
        setDestinations([]);
      } else {
        const normalized = ((fallbackData || []) as Omit<DestinationRow, "view_count">[]).map((destination) => ({
          ...destination,
          view_count: 0,
        }));
        setDestinations(normalized);
      }
    } else if (error) {
      setMessage({ type: "error", text: `Failed to load destinations: ${error.message}` });
      setDestinations([]);
    } else {
      setDestinations((data || []) as DestinationRow[]);
    }

    setIsLoading(false);
    } catch (error) {
      console.error('Authentication error:', error);
      setMessage({ type: "error", text: "Authentication error. Please try signing in again." });
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchDestinations();
  }, [fetchDestinations]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  useEffect(() => {
    if (!editImageFile) {
      setEditImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(editImageFile);
    setEditImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editImageFile]);

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

  const totalPages = Math.max(1, Math.ceil(destinations.length / cardsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedDestinations = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return destinations.slice(start, start + cardsPerPage);
  }, [destinations, currentPage, cardsPerPage]);

  const validateForm = (draft: DestinationForm, isEdit = false) => {
    if (!draft.title.trim()) return "Title is required.";
    if (!isEdit && !imageFile) return "Image is required.";
    return null;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
  };

  const uploadDestinationAsset = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please choose a valid image file.");
    }

    // File size validation for images
    const maxSizeMB = 5; // 5MB for images
    const minSizeKB = 10; // 10KB minimum for images
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const minSizeBytes = minSizeKB * 1024;

    if (file.size > maxSizeBytes) {
      throw new Error(`Image size exceeds maximum limit of ${maxSizeMB}MB. Please choose a smaller file.`);
    }

    if (file.size < minSizeBytes) {
      throw new Error(`Image size is below minimum limit of ${minSizeKB}KB. Please choose a larger file.`);
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `destinations/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("destinations")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      throw new Error(
        `Image upload failed: ${uploadError.message}. Ensure a public storage bucket named "destinations" exists.`
      );
    }

    const { data } = supabase.storage.from("destinations").getPublicUrl(filePath);
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

    let imageUrl = "";

    try {
      if (imageFile) {
        imageUrl = await uploadDestinationAsset(imageFile);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to upload image file.",
      });
      setIsSaving(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      video_url: imageUrl,
    };

    const destinationsQuery: any = supabase.from("destinations");

    if (editingId) {
      const { error } = await destinationsQuery.update(payload).eq("id", editingId);

      if (error) {
        setMessage({ type: "error", text: `Update failed: ${error.message}` });
      } else {
        setEditingId(null);
        setMessage({ type: "success", text: "Destination updated successfully." });
        await fetchDestinations();
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await destinationsQuery.insert({
        ...payload,
        created_by: user?.id || null,
      });

      if (error) {
        setMessage({ type: "error", text: `Create failed: ${error.message}` });
      } else {
        setMessage({ type: "success", text: "Destination created successfully." });
        resetForm();
        setCurrentPage(1);
        await fetchDestinations();
      }
    }

    setIsSaving(false);
  };

  const startEdit = (destination: DestinationRow) => {
    setEditingId(destination.id);
    setEditForm({
      title: destination.title,
      description: destination.description || "",
      video_url: destination.video_url,
    });
    setEditImageFile(null);
    setEditImagePreview("");
    setMessage(null);
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditImageFile(null);
    setEditImagePreview("");
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    const validationError = validateForm(editForm, true);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    let imageUrl = editForm.video_url;

    if (editImageFile) {
      try {
        imageUrl = await uploadDestinationAsset(editImageFile);
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to upload image file.",
        });
        setIsSaving(false);
        return;
      }
    }

    const destinationsQuery: any = supabase.from("destinations");
    const { error } = await destinationsQuery
      .update({
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        video_url: imageUrl,
      })
      .eq("id", editingId);

    if (error) {
      setMessage({ type: "error", text: `Update failed: ${error.message}` });
    } else {
      closeEditModal();
      setMessage({ type: "success", text: "Destination updated successfully." });
      await fetchDestinations();
    }

    setIsSaving(false);
  };

  const handleDelete = async (destination: DestinationRow) => {
    const confirmed = window.confirm(`Delete destination "${destination.title}"?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage(null);

    const destinationsQuery: any = supabase.from("destinations");
    const { error } = await destinationsQuery.delete().eq("id", destination.id);

    if (error) {
      setMessage({ type: "error", text: `Delete failed: ${error.message}` });
    } else {
      if (editingId === destination.id) {
        setEditingId(null);
      }
      setMessage({ type: "success", text: "Destination deleted successfully." });
      await fetchDestinations();
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Destination Management" subtitle="Add and edit destination videos" />

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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Create Destination</h2>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-1 lg:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destination Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Varanasi"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
                />
              </div>

              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destination Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-[#5b2d8e]"
                />
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short optional description for this destination"
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
                />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image Preview</p>
                {imagePreview ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={imagePreview}
                      alt="New destination preview"
                      className="h-44 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-center text-xs text-slate-500">
                    Upload one image to see a live preview.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-lg bg-[#5b2d8e] px-4 py-2 text-sm font-medium text-white hover:bg-[#4c2476] disabled:opacity-60"
              >
                Create Destination
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">All Destinations</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: cardsPerPage }).map((_, index) => (
                  <div
                    key={`destination-skeleton-${index}`}
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
            ) : destinations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No destinations yet.</div>
            ) : (
              <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedDestinations.map((destination) => (
                  <div key={destination.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <>
                      <div className="mb-4 group">
                        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 group-hover:border-purple-300 group-hover:shadow-xl">
                          <div className="h-48 overflow-hidden">
                            <img
                              src={destination.video_url}
                              alt={destination.title}
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-sm font-medium truncate">{destination.title}</p>
                            <p className="text-xs opacity-90">Click to view details</p>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{destination.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{destination.description || "No description"}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Views: {destination.view_count || 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Created: {new Date(destination.created_at).toLocaleDateString()}
                      </p>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(destination)}
                          disabled={isSaving}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(destination)}
                          disabled={isSaving}
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </>
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
          </div>

          {editingId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
              <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">Edit Destination</h3>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isSaving}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destination Title *</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Varanasi"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
                    />
                  </div>

                  <div className="space-y-1 lg:col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Replace Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-[#5b2d8e]"
                    />
                    <p className="text-xs text-slate-500">Leave empty to keep current image.</p>
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Short optional description for this destination"
                      rows={5}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image Preview</p>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={editImagePreview || editForm.video_url}
                        alt={`${editForm.title} preview`}
                        className="h-44 w-full object-cover"
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
        </>
      )}
    </div>
  );
}
