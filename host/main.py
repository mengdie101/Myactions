
#!/usr/bin/env python
# -*- encoding: utf-8 -*-

import os
import requests,json
from datetime import datetime, timedelta, timezone
import socket_query

hostLocation = r"host/hosts.txt"

# 更新host, 并刷新本地DNS
def updateHost():
    with open(hostLocation, "r") as f1:
        f1_lines = f1.readlines()
        with open("temphost", "w") as f2:
            for ip, domain in socket_query.gen_host():
                lines.append("%s %s"%(ip, domain))
    os.remove(hostLocation)
    os.rename("temphost",hostLocation)

if __name__ == "__main__":
    updateHost()
