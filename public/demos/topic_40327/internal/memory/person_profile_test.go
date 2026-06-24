package memory

import (
	"testing"
	"time"
)

func TestDeserializeAliasesEmpty(t *testing.T) {
	result := deserializeAliases("")
	if len(result) != 0 {
		t.Errorf("expected empty slice, got %v", result)
	}
}

func TestDeserializeAliasesValid(t *testing.T) {
	result := deserializeAliases(`["小明", "小红"]`)
	if len(result) != 2 {
		t.Fatalf("expected 2 aliases, got %d: %v", len(result), result)
	}
	if result[0] != "小明" {
		t.Errorf("expected 小明, got %s", result[0])
	}
	if result[1] != "小红" {
		t.Errorf("expected 小红, got %s", result[1])
	}
}

func TestDeserializeAliasesNilSafety(t *testing.T) {
	result := deserializeAliases("null")
	if result == nil {
		t.Error("expected non-nil slice, got nil")
	}
	if len(result) != 0 {
		t.Errorf("expected empty slice, got %v", result)
	}
}

func TestDeserializeSectionsEmpty(t *testing.T) {
	result := deserializeSections("")
	if len(result.IdentitySettings) != 0 {
		t.Errorf("expected empty sections, got %v", result)
	}
}

func TestDeserializeSectionsValid(t *testing.T) {
	json := `{
		"identity_settings": ["学生"],
		"relationship_settings": ["朋友"],
		"stable_facts": ["喜欢打游戏"],
		"interaction_preferences": ["喜欢开玩笑"],
		"recent_interactions": ["昨天聊了天气"],
		"uncertain_notes": ["可能喜欢动漫"]
	}`
	result := deserializeSections(json)
	if len(result.IdentitySettings) != 1 || result.IdentitySettings[0] != "学生" {
		t.Errorf("unexpected identity_settings: %v", result.IdentitySettings)
	}
	if len(result.RelationshipSettings) != 1 || result.RelationshipSettings[0] != "朋友" {
		t.Errorf("unexpected relationship_settings: %v", result.RelationshipSettings)
	}
	if len(result.StableFacts) != 1 || result.StableFacts[0] != "喜欢打游戏" {
		t.Errorf("unexpected stable_facts: %v", result.StableFacts)
	}
}

func TestDeserializeSectionsEmptyObject(t *testing.T) {
	result := deserializeSections("{}")
	if len(result.IdentitySettings) != 0 {
		t.Errorf("expected empty sections for {}, got %v", result)
	}
}

func TestBuildProfile(t *testing.T) {
	aliasesJSON := `["小明", "明明"]`
	sectionsJSON := `{"identity_settings":["学生"],"stable_facts":["喜欢打游戏"]}`
	createdStr := "2025-01-01 12:00:00"
	updatedStr := "2025-06-01 12:00:00"

	profile := buildProfile("u1", "小明", aliasesJSON, sectionsJSON, 3, createdStr, updatedStr)

	if profile.PersonID != "u1" {
		t.Errorf("expected PersonID u1, got %s", profile.PersonID)
	}
	if profile.PrimaryName != "小明" {
		t.Errorf("expected PrimaryName 小明, got %s", profile.PrimaryName)
	}
	if len(profile.Aliases) != 2 {
		t.Errorf("expected 2 aliases, got %d", len(profile.Aliases))
	}
	if profile.Version != 3 {
		t.Errorf("expected Version 3, got %d", profile.Version)
	}
	if len(profile.Sections.IdentitySettings) != 1 {
		t.Errorf("expected 1 identity_setting, got %d", len(profile.Sections.IdentitySettings))
	}
	if profile.CreatedAt.Year() != 2025 {
		t.Errorf("expected CreatedAt year 2025, got %d", profile.CreatedAt.Year())
	}
	if profile.UpdatedAt.Month() != time.June {
		t.Errorf("expected UpdatedAt June, got %v", profile.UpdatedAt.Month())
	}
}
