package main

import (
	"strings"
)

func (p *Plugin) getSiteURL() string {
	config := p.API.GetConfig()
	if config == nil || config.ServiceSettings.SiteURL == nil {
		return ""
	}
	return strings.TrimSuffix(*config.ServiceSettings.SiteURL, "/")
}

func (p *Plugin) getPluginURL() string {
	siteURL := p.getSiteURL()
	if siteURL == "" {
		return ""
	}
	return siteURL + "/plugins/" + p.API.GetPluginID()
}
