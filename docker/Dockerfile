FROM jupyterhub/jupyterhub

COPY requirements.txt /tmp/requirements.txt
COPY jupyterhub-ecsspawner-0.1.dev0.tar.gz /tmp/jupyterhub-ecsspawner-0.1.dev0.tar.gz
RUN python3 -m pip install --no-cache -r /tmp/requirements.txt
COPY jupyterhub_config.py /srv/jupyterhub/jupyterhub_config.py