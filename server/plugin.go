package main

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/mattermost/mattermost/server/public/plugin"
)

type Plugin struct {
	plugin.MattermostPlugin

	configurationLock sync.RWMutex
	configuration     *configuration
}

type publicConfig struct {
	LoomPublicAppId    string `json:"LoomPublicAppId"`
	LoomEnvironment    string `json:"LoomEnvironment"`
	EnableRecordButton bool   `json:"EnableRecordButton"`
	DefaultEmbedWidth  int    `json:"DefaultEmbedWidth"`
}

func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("Mattermost-User-Id")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	switch r.URL.Path {
	case "/config":
		p.handleConfig(w, r)
	default:
		http.NotFound(w, r)
	}
}

func (p *Plugin) handleConfig(w http.ResponseWriter, _ *http.Request) {
	config := p.getConfiguration()
	payload := publicConfig{
		LoomPublicAppId:    config.LoomPublicAppId,
		LoomEnvironment:    config.LoomEnvironment,
		EnableRecordButton: config.EnableRecordButton,
		DefaultEmbedWidth:  config.DefaultEmbedWidth,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(payload)
}
