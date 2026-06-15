package main

import (
	"reflect"

	"github.com/pkg/errors"
)

type configuration struct {
	LoomPublicAppId    string
	LoomEnvironment    string
	EnableRecordButton bool
	DefaultEmbedWidth  int
}

func (c *configuration) Clone() *configuration {
	clone := *c
	return &clone
}

func (p *Plugin) getConfiguration() *configuration {
	p.configurationLock.RLock()
	defer p.configurationLock.RUnlock()

	if p.configuration == nil {
		return &configuration{
			LoomEnvironment:    "production",
			EnableRecordButton: true,
			DefaultEmbedWidth:  480,
		}
	}

	return p.configuration
}

func (p *Plugin) setConfiguration(configuration *configuration) {
	p.configurationLock.Lock()
	defer p.configurationLock.Unlock()

	if configuration != nil && p.configuration == configuration {
		if reflect.ValueOf(*configuration).NumField() == 0 {
			return
		}
		clone := configuration.Clone()
		p.configuration = clone
		return
	}

	p.configuration = configuration
}

func (p *Plugin) OnConfigurationChange() error {
	configuration := new(configuration)

	if err := p.API.LoadPluginConfiguration(configuration); err != nil {
		return errors.Wrap(err, "failed to load plugin configuration")
	}

	if configuration.LoomEnvironment == "" {
		configuration.LoomEnvironment = "production"
	}
	if configuration.DefaultEmbedWidth <= 0 {
		configuration.DefaultEmbedWidth = 480
	}

	p.setConfiguration(configuration)

	return nil
}
