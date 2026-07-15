package model

type MQTTSetting struct {
	Broker      string `json:"broker"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	ClientID    string `json:"client_id"`
	TopicPrefix string `json:"topic_prefix"`
}

type AISetting struct {
	APIEndpoint string `json:"api_endpoint"`
	APIKey      string `json:"api_key"`
	Model       string `json:"model"`
}

type SystemSetting struct {
	MQTT MQTTSetting `json:"mqtt"`
	AI   AISetting   `json:"ai"`
}