package main

import "testing"

func TestExtractLoomShareURL(t *testing.T) {
	tests := []struct {
		message string
		want    string
	}{
		{
			message: "Check this https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184",
			want:    "https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184",
		},
		{
			message: "https://loom.com/share/abc123def456",
			want:    "https://loom.com/share/abc123def456",
		},
		{
			message: "https://www.loom.com/embed/abc123def456",
			want:    "https://www.loom.com/share/abc123def456",
		},
		{
			message: "no loom here",
			want:    "",
		},
	}

	for _, tc := range tests {
		got := extractLoomShareURL(tc.message)
		if got != tc.want {
			t.Fatalf("extractLoomShareURL(%q) = %q, want %q", tc.message, got, tc.want)
		}
	}
}
