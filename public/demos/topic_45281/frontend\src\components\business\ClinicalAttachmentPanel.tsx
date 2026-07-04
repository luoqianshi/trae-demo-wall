import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileImage, FileText, Image, Loader2, Paperclip, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clinicalAttachmentService } from "@/lib/services";
import type { ClinicalAttachment } from "@/lib/types";

interface ClinicalAttachmentPanelProps {
  patientId: number;
  visitId?: number;
  recordId?: number;
  uploadedBy?: number;
  compact?: boolean;
  title?: string;
}

const ATTACHMENT_TYPES = [
  { value: "patient_photo", label: "患者照片" },
  { value: "medical_record", label: "病历附件" },
  { value: "imaging_report", label: "影像图片" },
  { value: "lab_report", label: "检验报告" },
  { value: "consent_form", label: "知情同意书" },
  { value: "signature", label: "电子签名" },
  { value: "other", label: "其他附件" },
];

function formatSize(size?: number) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function typeLabel(value?: string) {
  return ATTACHMENT_TYPES.find((item) => item.value === value)?.label || value || "附件";
}

export default function ClinicalAttachmentPanel({
  patientId,
  visitId,
  recordId,
  uploadedBy,
  compact = false,
  title = "临床附件",
}: ClinicalAttachmentPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentType, setAttachmentType] = useState("medical_record");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);

  const imageAttachments = useMemo(
    () => attachments.filter((item) => item.file?.mimeType?.startsWith("image/")),
    [attachments],
  );

  const loadAttachments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clinicalAttachmentService.getByPatient({ patientId, visitId, recordId });
      const list = Array.isArray(res) ? res : (res as any).attachments || [];
      setAttachments(list);
    } catch (err: any) {
      setError(err.message || "附件加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) loadAttachments();
  }, [patientId, visitId, recordId]);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await clinicalAttachmentService.upload({
        file,
        patientId,
        visitId,
        recordId,
        attachmentType,
        remark,
        uploadedBy,
      });
      setRemark("");
      if (fileRef.current) fileRef.current.value = "";
      await loadAttachments();
    } catch (err: any) {
      setError(err.message || "附件上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定删除这个附件关联吗？文件审计记录会保留。")) return;
    await clinicalAttachmentService.delete(id);
    await loadAttachments();
  };

  return (
    <section className={`rounded-lg border border-border bg-card ${compact ? "p-3" : "p-4"} space-y-3`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
          <Badge variant="outline">{attachments.length}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={loadAttachments} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2">
        <select
          value={attachmentType}
          onChange={(event) => setAttachmentType(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {ATTACHMENT_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <input
          value={remark}
          onChange={(event) => setRemark(event.target.value)}
          placeholder="附件备注，例如：胸部CT原图、入院知情同意书"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
        <div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf,text/plain"
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />}
            上传
          </Button>
        </div>
      </div>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>}

      {imageAttachments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {imageAttachments.slice(0, compact ? 4 : 8).map((item) => {
            const url = item.file ? clinicalAttachmentService.fileUrl(item.file.fileUuid) : "#";
            return (
              <a key={item.id} href={url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-md border bg-muted">
                <div className="aspect-video bg-muted">
                  <img src={url} alt={item.file?.originalName || "附件图片"} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="truncate px-2 py-1 text-[11px] text-muted-foreground">{item.file?.originalName}</div>
              </a>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 size={16} className="mr-2 animate-spin" /> 正在加载附件...
          </div>
        ) : attachments.length === 0 ? (
          <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
            暂无附件，可上传患者照片、病历附件、影像图片或知情同意书。
          </div>
        ) : (
          attachments.map((item) => {
            const file = item.file;
            const url = file ? clinicalAttachmentService.fileUrl(file.fileUuid) : "#";
            const isImage = file?.mimeType?.startsWith("image/");
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {isImage ? <FileImage size={18} /> : file?.mimeType === "application/pdf" ? <FileText size={18} /> : <Image size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a href={url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium hover:text-primary">
                      {file?.originalName || "附件"}
                    </a>
                    <Badge variant="outline" className="shrink-0">{typeLabel(item.attachmentType)}</Badge>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {formatSize(file?.fileSize)} · {file?.mimeType || "-"}{item.remark ? ` · ${item.remark}` : ""}
                  </div>
                </div>
                <a href={url} target="_blank" rel="noreferrer" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-primary" title="打开/下载">
                  <Download size={15} />
                </a>
                <button className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(item.id)} title="删除关联">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
