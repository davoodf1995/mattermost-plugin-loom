package main

import (
	"fmt"

	"github.com/blang/semver/v4"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/pkg/errors"
)

const minimumServerVersion = "11.0.0"

func (p *Plugin) checkServerVersion() error {
	serverVersion, err := semver.Parse(p.API.GetServerVersion())
	if err != nil {
		return errors.Wrap(err, "failed to parse server version")
	}

	r := semver.MustParseRange(">=" + minimumServerVersion)
	if !r(serverVersion) {
		return fmt.Errorf("this plugin requires Mattermost v%s or later", minimumServerVersion)
	}

	return nil
}

func (p *Plugin) OnActivate() error {
	if err := p.checkServerVersion(); err != nil {
		return err
	}

	if err := p.registerCommands(); err != nil {
		return errors.Wrap(err, "failed to register commands")
	}

	return nil
}

func (p *Plugin) OnDeactivate() error {
	return nil
}

func (p *Plugin) registerCommands() error {
	return p.API.RegisterCommand(&model.Command{
		Trigger:          "loom",
		AutoComplete:     true,
		AutoCompleteDesc: "Record and share Loom videos in Mattermost",
		AutoCompleteHint: "[help]",
		DisplayName:      "Loom",
	})
}
