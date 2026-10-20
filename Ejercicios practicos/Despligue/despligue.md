```bash
(venv) festudio@pop-os:~/primera_flask$ ssh -p 2308 emiliano@172.16.2.87
emiliano@172.16.2.87's password: 
Welcome to Ubuntu 24.04.4 LTS (GNU/Linux 6.8.0-146-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Tue Oct 13 23:31:20 UTC 2026

  System load:  0.07               Temperature:           45.0 C
  Usage of /:   25.4% of 97.87GB   Processes:             31
  Memory usage: 12%                Users logged in:       1
  Swap usage:   0%                 IPv4 address for eth0: 10.50.0.213


Expanded Security Maintenance for Applications is not enabled.

157 updates can be applied immediately.
118 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

6 additional security updates can be applied with ESM Apps.
Learn more about enabling ESM Apps service at https://ubuntu.com/esm

New release '26.04.1 LTS' available.
Run 'do-release-upgrade' to upgrade to it.


Last login: Tue Oct 13 23:05:20 2026 from 127.0.0.1
emiliano@fullstack-template-emiliano:~$ sudo ufw allow 5000/tcp
[sudo] password for emiliano: 
Rules updated
Rules updated (v6)
emiliano@fullstack-template-emiliano:~$ docker compose up -d --build
no configuration file provided: not found
emiliano@fullstack-template-emiliano:~$ cd ~/primera_flask
cp .env.example .env
emiliano@fullstack-template-emiliano:~/primera_flask$ docker compose up -d --build
WARN[0000] Docker Compose is configured to build using Bake, but buildx isn't installed 
[+] Building 9.8s (11/11) FINISHED                           docker:default
 => [web internal] load build definition from dockerfile               0.0s
 => => transferring dockerfile: 550B                                   0.0s
 => [web internal] load metadata for docker.io/library/python:3.12-sl  2.0s
 => [web internal] load .dockerignore                                  0.0s
 => => transferring context: 157B                                      0.0s
 => [web 1/5] FROM docker.io/library/python:3.12-slim@sha256:a6e34c59  4.0s
 => => resolve docker.io/library/python:3.12-slim@sha256:a6e34c598f24  0.0s
 => => sha256:bbc5a12237474ec0b23b5051260d56d6436a24d70d9 249B / 249B  0.2s
 => => sha256:6912e23eb44595b44dc6d9882b34f305ad6f6 12.12MB / 12.12MB  1.3s
 => => sha256:75b6a36c64a1cf3520fc4b4aae4739d5caa8a6a 1.29MB / 1.29MB  0.8s
 => => sha256:ecc510c1e359bdc007b39802570bb7e4dec7d 29.84MB / 29.84MB  2.3s
 => => extracting sha256:ecc510c1e359bdc007b39802570bb7e4dec7d6ebccf3  0.8s
 => => extracting sha256:75b6a36c64a1cf3520fc4b4aae4739d5caa8a6a05c27  0.1s
 => => extracting sha256:6912e23eb44595b44dc6d9882b34f305ad6f6e9667ce  0.5s
 => => extracting sha256:bbc5a12237474ec0b23b5051260d56d6436a24d70d9c  0.0s
 => [web internal] load build context                                  0.1s
 => => transferring context: 2.38MB                                    0.0s
 => [web 2/5] WORKDIR /app                                             0.0s
 => [web 3/5] COPY requirements.txt .                                  0.0s
 => [web 4/5] RUN pip install --no-cache-dir -r requirements.txt       2.8s
 => [web 5/5] COPY . .                                                 0.1s 
 => [web] exporting to image                                           0.8s 
 => => exporting layers                                                0.4s
 => => exporting manifest sha256:595c43f4c4adb830183353beed3196de2659  0.0s
 => => exporting config sha256:20b262e137fa2c7c5ab4c4d0151df6ecbd8320  0.0s
 => => exporting attestation manifest sha256:c824468cadc3690f6566f91d  0.0s
 => => exporting manifest list sha256:397543f971a9a2566333787d3d37352  0.0s
 => => naming to docker.io/library/primera_flask-web:latest            0.0s
 => => unpacking to docker.io/library/primera_flask-web:latest         0.2s
 => [web] resolving provenance for metadata file                       0.0s
[+] Running 4/4
 ✔ web                            Built                                0.0s 
 ✔ Network primera_flask_default  C...                                 0.1s 
 ✔ Volume practica_datos          Created                              0.0s 
 ✔ Container primera_flask_app    Sta...                               0.3s 
emiliano@fullstack-template-emiliano:~/primera_flask$ docker ps
CONTAINER ID   IMAGE               COMMAND                  CREATED          STATUS          PORTS                                         NAMES
bf4e6b4fb17a   primera_flask-web   "gunicorn --bind 0.0…"   31 seconds ago   Up 30 seconds   0.0.0.0:5000->5000/tcp, [::]:5000->5000/tcp   primera_flask_app
emiliano@fullstack-template-emiliano:~/primera_flask$ docker compose ps
NAME                IMAGE               COMMAND                  SERVICE   CREATED          STATUS          PORTS
primera_flask_app   primera_flask-web   "gunicorn --bind 0.0…"   web       37 seconds ago   Up 36 seconds   0.0.0.0:5000->5000/tcp, [::]:5000->5000/tcp
emiliano@fullstack-template-emiliano:~/primera_flask$ docker compose logs -f
primera_flask_app  | [2026-10-13 23:33:43 +0000] [1] [INFO] Starting gunicorn 26.2.0
primera_flask_app  | [2026-10-13 23:33:43 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
primera_flask_app  | [2026-10-13 23:33:43 +0000] [1] [INFO] Using worker: gthread
primera_flask_app  | [2026-10-13 23:33:43 +0000] [7] [INFO] Booting worker with pid: 7
primera_flask_app  | [2026-10-13 23:33:43 +0000] [8] [INFO] Booting worker with pid: 8
primera_flask_app  | [2026-10-13 23:33:43 +0000] [1] [INFO] Control socket listening at /root/.gunicorn/gunicorn.ctl
^C
emiliano@fullstack-template-emiliano:~/primera_flask$ sudo ufw allow 5000/tcp
Skipping adding existing rule
Skipping adding existing rule (v6)
emiliano@fullstack-template-emiliano:~/primera_flask$ nano .env
emiliano@fullstack-template-emiliano:~/primera_flask$ docker compose up -d
[+] Running 1/1
 ✔ Container primera_flask_app  Start...                               0.7s 
emiliano@fullstack-template-emiliano:~/primera_flask$ 
 *  Historial restaurado 

festudio@pop-os:~/primera_flask$ ssh -p 2308 emiliano@172.16.2.87
emiliano@172.16.2.87's password: 
Welcome to Ubuntu 24.04.4 LTS (GNU/Linux 6.8.0-146-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Tue Oct 13 23:31:20 UTC 2026

  System load:  0.07               Temperature:           45.0 C
  Usage of /:   25.4% of 97.87GB   Processes:             31
  Memory usage: 12%                Users logged in:       1
  Swap usage:   0%                 IPv4 address for eth0: 10.50.0.213


Expanded Security Maintenance for Applications is not enabled.

157 updates can be applied immediately.
118 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

6 additional security updates can be applied with ESM Apps.
Learn more about enabling ESM Apps service at https://ubuntu.com/esm

New release '26.04.1 LTS' available.
Run 'do-release-upgrade' to upgrade to it.


Last login: Tue Oct 13 23:31:20 2026 from 127.0.0.1
emiliano@fullstack-template-emiliano:~$ ^C
emiliano@fullstack-template-emiliano:~$  source /home/festudio/primera_flask/venv/bin/activate
-bash: /home/festudio/primera_flask/venv/bin/activate: No such file or directory
emiliano@fullstack-template-emiliano:~$ docker compose ps
no configuration file provided: not found
emiliano@fullstack-template-emiliano:~$ docker ps
CONTAINER ID   IMAGE               COMMAND                  CREATED          STATUS          PORTS                                     NAMES
f02d6030cd47   primera_flask-web   "gunicorn --bind 0.0…"   10 minutes ago   Up 10 minutes   0.0.0.0:80->5000/tcp, [::]:80->5000/tcp   primera_flask_app
emiliano@fullstack-template-emiliano:~$ Connection to 172.16.2.87 closed by remote host.
Connection to 172.16.2.87 closed.
```