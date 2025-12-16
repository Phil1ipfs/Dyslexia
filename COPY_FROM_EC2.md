# Copying Files from EC2 to Local Machine

## Prerequisites
- Your EC2 instance IP: `ip-172-31-27-97` (or the public IP)
- Your SSH key file (e.g., `literexia-backend-key.pem` or `.ppk`)
- SSH access to the EC2 instance

## Option 1: Copy the entire backend directory

### Using SCP (Secure Copy)
```bash
# From your local machine, navigate to the Dyslexia directory
cd /Users/goodboykit/Documents/Dyslexia

# Copy entire backend directory (replace with your actual EC2 IP and key path)
scp -r -i /path/to/your/key.pem ec2-user@ip-172-31-27-97:~/Dyslexia/backend/* ./backend/

# Or if you need to specify the full path:
scp -r -i /path/to/your/key.pem ec2-user@ip-172-31-27-97:/var/www/literexia/backend/* ./backend/
```

### Using RSYNC (Better for syncing, preserves permissions)
```bash
# Sync entire backend directory (excludes node_modules by default)
rsync -avz -e "ssh -i /path/to/your/key.pem" \
  ec2-user@ip-172-31-27-97:~/Dyslexia/backend/ \
  ./backend/ \
  --exclude 'node_modules' \
  --exclude '*.log'
```

## Option 2: Copy only the .env file

### Using SCP
```bash
# Copy just the .env file
scp -i /path/to/your/key.pem \
  ec2-user@ip-172-31-27-97:~/Dyslexia/backend/.env \
  ./backend/.env
```

### Using RSYNC
```bash
# Sync just the .env file
rsync -avz -e "ssh -i /path/to/your/key.pem" \
  ec2-user@ip-172-31-27-97:~/Dyslexia/backend/.env \
  ./backend/.env
```

## Option 3: Copy specific files/directories

### Copy multiple specific files
```bash
scp -i /path/to/your/key.pem \
  ec2-user@ip-172-31-27-97:~/Dyslexia/backend/.env \
  ec2-user@ip-172-31-27-97:~/Dyslexia/backend/server.js \
  ec2-user@ip-172-31-27-97:~/Dyslexia/backend/package.json \
  ./backend/
```

### Copy a specific directory
```bash
scp -r -i /path/to/your/key.pem \
  ec2-user@ip-172-31-27-97:~/Dyslexia/backend/config \
  ./backend/
```

## Finding Your EC2 Public IP

If you need the public IP instead of the private IP:
```bash
# On EC2, run:
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

Then use that IP in the commands above.

## Important Notes

1. **Replace the key path**: Update `/path/to/your/key.pem` with your actual SSH key path
2. **Check the EC2 path**: The backend might be at:
   - `~/Dyslexia/backend/` (home directory)
   - `/var/www/literexia/backend/` (if deployed there)
3. **Exclude node_modules**: Don't copy `node_modules` - run `npm install` locally instead
4. **Backup first**: Consider backing up your local backend before overwriting

## Quick Commands (Adjust paths as needed)

### Most common: Copy .env file
```bash
scp -i ~/.ssh/literexia-backend-key.pem \
  ec2-user@YOUR_EC2_PUBLIC_IP:~/Dyslexia/backend/.env \
  ./backend/.env
```

### Sync everything except node_modules
```bash
rsync -avz -e "ssh -i ~/.ssh/literexia-backend-key.pem" \
  --exclude 'node_modules' \
  --exclude '*.log' \
  --exclude '.git' \
  ec2-user@YOUR_EC2_PUBLIC_IP:~/Dyslexia/backend/ \
  ./backend/
```

