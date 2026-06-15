package main

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
	"github.com/pkg/errors"
)

const postTypeLoom = "custom_loom"

var loomShareURLPattern = regexp.MustCompile(`https?://(?:www\.)?loom\.com/share/[a-zA-Z0-9]+`)

// MessageHasBeenPosted upgrades plain Loom share links into rich custom_loom posts.
func (p *Plugin) MessageHasBeenPosted(_ *plugin.Context, post *model.Post) {
	if post == nil || post.Id == "" {
		return
	}

	if post.Type == postTypeLoom {
		normalizeLoomPost(post)
		if _, err := p.API.UpdatePost(post); err != nil {
			p.API.LogError("failed to normalize loom post", "post_id", post.Id, "error", err.Error())
		}
		return
	}

	if post.Type != "" && post.Type != model.PostTypeDefault {
		return
	}

	sharedURL := extractLoomShareURL(post.Message)
	if sharedURL == "" {
		return
	}

	updatedPost := post.Clone()
	updatedPost.Type = postTypeLoom
	updatedPost.AddProp("loom_video", true)
	updatedPost.AddProp("sharedUrl", sharedURL)
	if updatedPost.Message == sharedURL {
		updatedPost.Message = "Loom video"
	}

	if _, err := p.API.UpdatePost(updatedPost); err != nil {
		p.API.LogError("failed to upgrade loom post", "post_id", post.Id, "error", err.Error())
	}
}

func extractLoomShareURL(message string) string {
	match := loomShareURLPattern.FindString(strings.TrimSpace(message))
	return match
}

func normalizeLoomPost(post *model.Post) {
	if post.GetProp("loom_video") == nil {
		post.AddProp("loom_video", true)
	}

	if sharedURL, ok := post.GetProp("sharedUrl").(string); !ok || sharedURL == "" {
		if url := extractLoomShareURL(post.Message); url != "" {
			post.AddProp("sharedUrl", url)
		}
	}
}

func (p *Plugin) registerCommands() error {
	if err := p.API.RegisterCommand(&model.Command{
		Trigger:              "loom",
		AutoComplete:         true,
		AutoCompleteDesc:     "Record and share Loom videos in Mattermost",
		AutoCompleteHint:     "[help|record]",
		AutocompleteIconData: p.getAutocompleteIconData(),
		IconURL:              p.getCommandIconURL(),
		DisplayName:          "Loom",
	}); err != nil {
		return errors.Wrap(err, "failed to register loom command")
	}
	return nil
}

func (p *Plugin) ExecuteCommand(_ *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	fields := strings.Fields(args.Command)
	subcommand := ""
	if len(fields) > 1 {
		subcommand = strings.ToLower(fields[1])
	}

	switch subcommand {
	case "", "help":
		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text: strings.TrimSpace(`
**Loom plugin**

Use the **Record Loom** button in the post textbox, app bar, or channel header to record a video.

Paste a Loom share link (https://www.loom.com/share/...) in a channel to show a rich inline player.

**Setup:** System Console → Plugins → Loom → add your Loom Public App ID from [dev.loom.com](https://dev.loom.com).
`),
		}, nil
	case "record":
		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text:         "Use the **Record Loom** button in the post textbox, app bar, or channel header to start recording.",
		}, nil
	default:
		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text:         fmt.Sprintf("Unknown subcommand `%s`. Try `/loom help`.", subcommand),
		}, nil
	}
}
