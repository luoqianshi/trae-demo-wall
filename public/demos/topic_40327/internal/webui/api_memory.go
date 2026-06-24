package webui

import (
	"encoding/json"
	"net/http"
	"strconv"

	"YaraFlow/internal/memory"
)

type MemoryDebugRequest struct {
	Query       string   `json:"query"`
	SessionID   string   `json:"session_id"`
	GroupID     string   `json:"group_id"`
	Limit       int      `json:"limit"`
	SearchMode  string   `json:"search_mode"`
	SourceKinds []string `json:"source_kinds"`
}

type MemoryDebugResult struct {
	Success      bool              `json:"success"`
	Query        string            `json:"query"`
	SearchMode   string            `json:"search_mode"`
	Hits         []MemoryHitDetail `json:"hits"`
	TotalHits    int               `json:"total_hits"`
	ProcessingMs int64             `json:"processing_ms"`
}

type MemoryHitDetail struct {
	FragmentID   string      `json:"fragment_id"`
	Content      string      `json:"content"`
	Score        float32     `json:"score"`
	SourceKind   string      `json:"source_kind"`
	SessionID    string      `json:"session_id"`
	GroupID      string      `json:"group_id"`
	UserID       string      `json:"user_id"`
	AccessCount  int         `json:"access_count"`
	CreatedAt    string      `json:"created_at"`
	ExpiresAt    *string     `json:"expires_at"`
	Metadata     interface{} `json:"metadata"`
}

func (s *Server) handleMemoryDebug(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	var req MemoryDebugRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, 400, "Invalid request body: "+err.Error())
		return
	}

	if req.Query == "" {
		jsonError(w, 400, "Query is required")
		return
	}

	if req.Limit <= 0 {
		req.Limit = 10
	}

	var sourceKinds []memory.SourceKind
	for _, kind := range req.SourceKinds {
		sourceKinds = append(sourceKinds, memory.SourceKind(kind))
	}

	queryReq := memory.MemoryQueryRequest{
		CurrentMessage: req.Query,
		SessionID:      req.SessionID,
		GroupID:        req.GroupID,
		Limit:          req.Limit,
		SourceKinds:    sourceKinds,
		SearchMode:     req.SearchMode,
	}

	result, err := memory.DefaultManager.Query(queryReq)
	if err != nil {
		jsonError(w, 500, "Memory query failed: "+err.Error())
		return
	}

	var hits []MemoryHitDetail
	for _, hit := range result.Hits {
		frag := hit.Fragment
		var expiresAt *string
		if frag.ExpiresAt != nil {
			expStr := frag.ExpiresAt.Format("2006-01-02 15:04:05")
			expiresAt = &expStr
		}

		hits = append(hits, MemoryHitDetail{
			FragmentID:   frag.ID,
			Content:      frag.Content,
			Score:        hit.Score,
			SourceKind:   string(frag.SourceKind),
			SessionID:    frag.SessionID,
			GroupID:      frag.GroupID,
			UserID:       frag.UserID,
			AccessCount:  frag.AccessCount,
			CreatedAt:    frag.CreatedAt.Format("2006-01-02 15:04:05"),
			ExpiresAt:    expiresAt,
			Metadata:     frag.Metadata,
		})
	}

	jsonResponse(w, MemoryDebugResult{
		Success:      true,
		Query:        req.Query,
		SearchMode:   req.SearchMode,
		Hits:         hits,
		TotalHits:    len(hits),
		ProcessingMs: 0,
	})
}

func (s *Server) handleMemoryStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	count, vecLen, idxLen, err := memory.DefaultManager.GetStats()
	if err != nil {
		jsonError(w, 500, "Failed to get memory stats: "+err.Error())
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success":          true,
		"memory_fragments": count,
		"vector_entries":   vecLen,
		"index_entries":    idxLen,
	})
}

func (s *Server) handleMemoryIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	var req struct {
		Content    string `json:"content"`
		SessionID  string `json:"session_id"`
		GroupID    string `json:"group_id"`
		UserID     string `json:"user_id"`
		SourceKind string `json:"source_kind"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, 400, "Invalid request body: "+err.Error())
		return
	}

	if req.Content == "" {
		jsonError(w, 400, "Content is required")
		return
	}

	sourceKind := memory.SourceKind(req.SourceKind)
	if sourceKind == "" {
		sourceKind = memory.SourceChatMessage
	}

	err := memory.DefaultManager.Ingest(req.Content, req.SessionID, "debug", req.GroupID, req.UserID, sourceKind, "")
	if err != nil {
		jsonError(w, 500, "Ingest failed: "+err.Error())
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "Memory ingested successfully",
	})
}

func (s *Server) handleMemoryDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	fragmentID := r.URL.Query().Get("id")
	if fragmentID == "" {
		jsonError(w, 400, "Fragment ID is required")
		return
	}

	err := memory.DefaultManager.DeleteByID(fragmentID)
	if err != nil {
		jsonError(w, 500, "Delete failed: "+err.Error())
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "Memory deleted successfully",
	})
}

func (s *Server) handleMemoryList(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		var err error
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			jsonError(w, 400, "Invalid limit parameter")
			return
		}
	}

	ids, err := memory.DefaultManager.GetAllIDs()
	if err != nil {
		jsonError(w, 500, "Failed to get memory IDs: "+err.Error())
		return
	}

	if len(ids) > limit {
		ids = ids[:limit]
	}

	frags, err := memory.DefaultManager.GetByIDs(ids)
	if err != nil {
		jsonError(w, 500, "Failed to get memory fragments: "+err.Error())
		return
	}

	var results []MemoryHitDetail
	for _, frag := range frags {
		var expiresAt *string
		if frag.ExpiresAt != nil {
			expStr := frag.ExpiresAt.Format("2006-01-02 15:04:05")
			expiresAt = &expStr
		}

		results = append(results, MemoryHitDetail{
			FragmentID:  frag.ID,
			Content:     frag.Content,
			SourceKind:  string(frag.SourceKind),
			SessionID:   frag.SessionID,
			GroupID:     frag.GroupID,
			UserID:      frag.UserID,
			AccessCount: frag.AccessCount,
			CreatedAt:   frag.CreatedAt.Format("2006-01-02 15:04:05"),
			ExpiresAt:   expiresAt,
			Metadata:    frag.Metadata,
		})
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"data":    results,
		"total":   len(results),
	})
}
