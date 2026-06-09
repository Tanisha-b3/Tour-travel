import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchDestinationById, createDestination, updateDestination, uploadImage, uploadImages } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

const ease = [0.22, 1, 0.36, 1];

const TYPES = ["beach", "cultural", "adventure", "luxury"];

const EMPTY = {
  name: "",
  image: "",
  images: [],
  description: "",
  price: "",
  duration: "",
  category: "beach",
  type: "beach",
  location: "",
  facilities: [],
  highlights: [],
};

function validateField(name, value) {
  switch (name) {
    case "name":
      if (!String(value).trim()) return "Name is required";
      if (String(value).trim().length < 2) return "Name must be at least 2 characters";
      if (String(value).trim().length > 80) return "Name must be under 80 characters";
      return "";
    case "location":
      if (!String(value).trim()) return "Location is required";
      if (String(value).trim().length < 2) return "Location must be at least 2 characters";
      return "";
    case "price": {
      const n = Number(value);
      if (value === "" || value === null || value === undefined) return "Price is required";
      if (!Number.isFinite(n) || n < 0) return "Enter a valid price (0 or more)";
      if (n > 999999) return "Price must be under ₹9,99,999";
      return "";
    }
    case "duration":
      if (!String(value).trim()) return "Duration is required";
      if (String(value).trim().length < 3) return "Enter a valid duration (e.g. 3 Days)";
      if (String(value).trim().length > 40) return "Duration must be under 40 characters";
      return "";
    case "description":
      if (!String(value).trim()) return "Description is required";
      if (String(value).trim().length < 10) return "Description must be at least 10 characters";
      if (String(value).trim().length > 2000) return "Description must be under 2000 characters";
      return "";
    case "image":
      if (!String(value).trim()) return "Cover image is required";
      return "";
    default:
      return "";
  }
}

function Field({ label, hint, error, children, darkMode }) {
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>{error}</p>}
    </div>
  );
}

const inputCls = (darkMode, hasError) =>
  `w-full px-3.5 py-2.5 rounded-xl text-sm outline-none border transition-colors ${
    hasError
      ? "border-rose-500/50 bg-rose-500/5"
      : darkMode
      ? "bg-white/5 border-white/8 text-white placeholder:text-slate-500 focus:border-[#31487A]/50"
      : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50"
  }`;

function ChipsInput({ values, onChange, placeholder, darkMode }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) { setDraft(""); return; }
    onChange([...values, v]);
    setDraft("");
  };
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div className={`flex flex-wrap gap-1.5 px-3 py-2 rounded-xl border ${darkMode ? "bg-white/5 border-white/8" : "bg-slate-50 border-slate-200"}`}>
      {values.map((v, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#31487A]/10 text-[#31487A]">
          {v}
          <button type="button" onClick={() => remove(i)} className="hover:text-rose-400 bg-transparent border-none cursor-pointer">✕</button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
        className={`flex-1 min-w-[120px] bg-transparent text-sm outline-none border-none py-1 ${darkMode ? "text-white placeholder:text-slate-500" : "text-[#0a0f1e] placeholder:text-slate-400"}`}
      />
    </div>
  );
}

function ImageUpload({ value, onChange, onError, token, darkMode, label = "Cover Image" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => { setPreview(value || ""); }, [value]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { onError?.("Image must be under 5 MB"); return; }
    setUploading(true);
    try {
      const url = await uploadImage(file, token);
      onChange(url);
      setPreview(url);
      setLoadFailed(false);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
            darkMode
              ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
          } disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Choose File
            </>
          )}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => { onChange(""); setPreview(""); setLoadFailed(false); }}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border-none"
          >
            Remove
          </button>
        )}
      </div>
      {preview && !loadFailed && (
        <div className="mt-2 h-32 w-full max-w-[280px] rounded-xl overflow-hidden border border-slate-200 dark:border-white/8">
          <img src={preview} alt="preview" className="w-full h-full object-cover" onError={() => setLoadFailed(true)} />
        </div>
      )}
      {preview && loadFailed && <p className="text-[11px] text-amber-500 mt-1">⚠ Image failed to load</p>}
    </div>
  );
}

function GalleryUpload({ values, onChange, token, darkMode }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const invalid = files.find((f) => f.size > 5 * 1024 * 1024);
    if (invalid) { alert("Each image must be under 5 MB"); return; }
    setUploading(true);
    try {
      const urls = await uploadImages(files, token);
      onChange([...(values || []), ...urls]);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
            darkMode
              ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
          } disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Upload Photos
            </>
          )}
        </button>
      </div>
      {values?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {values.map((url, i) => (
            <div key={i} className="relative group h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-white/8">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500/90 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDestinationForm() {
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const navigate = useNavigate();
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const addToast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchDestinationById(id)
      .then((d) => setForm({
        name: d.name || "",
        image: d.image || "",
        images: Array.isArray(d.images) ? d.images : [],
        description: d.description || "",
        price: d.price ?? "",
        duration: d.duration || "",
        category: d.category || "beach",
        type: d.type || "beach",
        location: d.location || "",
        facilities: Array.isArray(d.facilities) ? d.facilities : [],
        highlights: Array.isArray(d.highlights) ? d.highlights : [],
      }))
      .catch((e) => addToast("error", e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit, addToast]);

  const validate = () => {
    const errs = {};
    ["name", "location", "price", "duration", "description", "image"].forEach((f) => {
      const msg = validateField(f, form[f]);
      if (msg) errs[f] = msg;
    });
    return errs;
  };

  const handleBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    const msg = validateField(field, form[field]);
    setErrors((e) => {
      const next = { ...e };
      if (msg) next[field] = msg; else delete next[field];
      return next;
    });
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    if (touched[field]) {
      const msg = validateField(field, val);
      setErrors((e) => {
        const next = { ...e };
        if (msg) next[field] = msg; else delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    const allTouched = {};
    ["name", "location", "price", "duration", "description", "image"].forEach((f) => { allTouched[f] = true; });
    setTouched(allTouched);
    setErrors(errs);
    if (Object.keys(errs).length) {
      addToast("error", "Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      price: Number(form.price),
    };
    try {
      if (isEdit) {
        await updateDestination(id, payload, token);
        addToast("success", "Destination updated");
      } else {
        await createDestination(payload, token);
        addToast("success", "Destination created");
      }
      navigate("/admin/destinations");
    } catch (err) {
      addToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading destination…</div>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className={`rounded-2xl border p-5 sm:p-7 ${
          darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Name *" darkMode={darkMode} error={touched.name && errors.name}>
            <input value={form.name} onChange={handleChange("name")} onBlur={handleBlur("name")} className={inputCls(darkMode, touched.name && errors.name)} placeholder="Bali, Indonesia" maxLength={80} />
          </Field>
          <Field label="Location *" darkMode={darkMode} error={touched.location && errors.location}>
            <input value={form.location} onChange={handleChange("location")} onBlur={handleBlur("location")} className={inputCls(darkMode, touched.location && errors.location)} placeholder="Indonesia" maxLength={80} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <Field label="Price (IN RUPEES) *" darkMode={darkMode} error={touched.price && errors.price}>
            <input type="number" min="0" max="999999" value={form.price} onChange={handleChange("price")} onBlur={handleBlur("price")} className={inputCls(darkMode, touched.price && errors.price)} placeholder="1299" />
          </Field>
          <Field label="Duration *" darkMode={darkMode} error={touched.duration && errors.duration} hint="e.g. 7 Days / 6 Nights">
            <input value={form.duration} onChange={handleChange("duration")} onBlur={handleBlur("duration")} className={inputCls(darkMode, touched.duration && errors.duration)} placeholder="7 Days / 6 Nights" maxLength={40} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <Field label="Type" darkMode={darkMode}>
            <select value={form.type} onChange={handleChange("type")} className={inputCls(darkMode) + " cursor-pointer"}>
              {TYPES.map((t) => <option key={t} value={t} className={darkMode ? "bg-[#1E2E4F]" : ""}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Category" darkMode={darkMode} hint="Typically same as Type">
            <input value={form.category} onChange={handleChange("category")} className={inputCls(darkMode)} placeholder="beach" maxLength={40} />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Description *" darkMode={darkMode} error={touched.description && errors.description}>
            <textarea
              value={form.description}
              onChange={handleChange("description")}
              onBlur={handleBlur("description")}
              rows={4}
              className={inputCls(darkMode, touched.description && errors.description) + " resize-none"}
              placeholder="Tell travelers what makes this destination special…"
              maxLength={2000}
            />
            <p className={`text-[10px] mt-1 text-right ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{String(form.description).length}/2000</p>
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Cover Image *" darkMode={darkMode} error={touched.image && errors.image} hint="Upload or paste a URL">
            <ImageUpload
              value={form.image}
              onChange={(url) => {
                setForm((p) => ({ ...p, image: url }));
                if (touched.image) {
                  const msg = validateField("image", url);
                  setErrors((e) => {
                    const next = { ...e };
                    if (msg) next.image = msg; else delete next.image;
                    return next;
                  });
                }
              }}
              onError={(msg) => addToast("error", msg)}
              token={token}
              darkMode={darkMode}
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Gallery Images" darkMode={darkMode} hint="Upload multiple photos">
            <GalleryUpload
              values={form.images}
              onChange={(images) => setForm((p) => ({ ...p, images }))}
              token={token}
              darkMode={darkMode}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <Field label="Facilities" darkMode={darkMode} hint="Press Enter to add each facility">
            <ChipsInput values={form.facilities} onChange={(v) => setForm((p) => ({ ...p, facilities: v }))} placeholder="Hotel Accommodation" darkMode={darkMode} />
          </Field>
          <Field label="Highlights" darkMode={darkMode} hint="Press Enter to add each highlight">
            <ChipsInput values={form.highlights} onChange={(v) => setForm((p) => ({ ...p, highlights: v }))} placeholder="Temple Tours" darkMode={darkMode} />
          </Field>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-7 pt-5 border-t border-slate-200/60 dark:border-white/8">
          <Link
            to="/admin/destinations"
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-center no-underline ${
              darkMode ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-[#31487A]/30 transition-shadow disabled:opacity-60 cursor-pointer border-none"
            style={{ background: "linear-gradient(135deg, #31487A 0%, #31487A 100%)" }}
          >
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Destination"}
          </button>
        </div>
      </motion.div>
    </form>
  );
}
