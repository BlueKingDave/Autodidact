variable "service_name"          { type = string }
variable "region"                { type = string }
variable "image"                 { type = string }
variable "min_instances"         { type = number; default = 1 }
variable "max_instances"         { type = number; default = 10 }
variable "cpu"                   { type = string; default = "1" }
variable "memory"                { type = string; default = "512Mi" }
variable "service_account_email" { type = string }
variable "allow_public"          { type = bool; default = false }
variable "env_vars"              { type = map(string); default = {} }
