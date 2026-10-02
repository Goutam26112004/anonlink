# Coturn Installation & Configuration Guide (Self-Hosted WebRTC Relay)

This guide outlines how to deploy and configure a self-hosted **Coturn** TURN/STUN server on a single Ubuntu VM (e.g. Oracle Cloud Always Free instance) to act as a fallback network relay for anonymous WebRTC calls.

---

## 1. Installation on Ubuntu VM

To install the Coturn package on a standard Debian/Ubuntu Linux instance, run:
```bash
sudo apt update
sudo apt install -y coturn
```

Ensure it starts automatically on system boot:
```bash
sudo systemctl enable coturn
```

---

## 2. Configuration file (`/etc/turnserver.conf`)

Edit the turnserver configuration using `sudo nano /etc/turnserver.conf` and populate it with the following parameters:

```ini
# Listening Ports
listening-port=3478
tls-listening-port=5349

# IP Addresses (adjust external-ip to match the public IP of your VM)
listening-ip=0.0.0.0
external-ip=YOUR_PUBLIC_VM_IP

# Realm (use your domain name or project name)
realm=anonchat.net

# Time-Windowed Credentials Auth (matches the backend REST signing logic)
use-auth-secret
static-auth-secret=coturnsecretkey123

# Allow only authenticated connections
no-anonymous
no-tls-anon

# DTLS and TLS settings
fingerprint
lt-cred-mech

# Limit ports used for WebRTC relays (important for firewall configs)
min-port=49152
max-port=65535

# Logging options
no-stdout-log
log-file=/var/log/turnserver/turnserver.log
```

---

## 3. Firewall Configurations (UFW & Cloud Security Lists)

Ensure the following ports are open in both your Linux firewall (`ufw`) and your cloud security list:
* `3478` TCP & UDP (STUN/TURN)
* `5349` TCP & UDP (STUN/TURN over TLS)
* `49152` to `65535` UDP (WebRTC relay traffic range)

Commands to open ports in UFW:
```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp
sudo ufw reload
```

---

## 4. Troubleshooting Checklist

1. **ICE Connection Fails (Timeout)**:
   * Verify that the Coturn service is running: `sudo systemctl status coturn`
   * Check your cloud firewall rules to ensure that the UDP port range `49152-65535` is completely open to the internet.
2. **Log Checking**:
   * Inspect the TURN log files for authentication errors: `tail -n 100 /var/log/turnserver/turnserver.log`
   * If you see `HMAC mismatch`, verify that the `COTURN_SHARED_SECRET` in your backend `.env` matches the `static-auth-secret` in `/etc/turnserver.conf` exactly.
