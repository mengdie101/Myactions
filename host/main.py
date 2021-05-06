
#!/usr/bin/env python
# -*- encoding: utf-8 -*-

import shutil
import os,sys,ctypes
import datetime
import platform
import socket_query

hostLocation = r"hosts"

def dropDuplication(line):
    flag = False
    if "#*******" in line:
        return True
    for site in sites:
        if site in line:
            flag = flag or True
        else:
            flag = flag or False
    return flag

# 更新host, 并刷新本地DNS
def updateHost():
    with open(hostLocation, "r") as f1:
        f1_lines = f1.readlines()
        with open("temphost", "w") as f2:
            for line in f1_lines:                       # 为了防止 host 越写用越长，需要删除之前更新的含有github相关内容
                if dropDuplication(line) == False:
                    f2.write(line)
            f2.write("#*********************github " +
                     str(today) + " update********************\n")
            for ip, domain in socket_query.gen_host():
                lines.append("%s %s"%(ip, domain))
    os.remove(hostLocation)
    os.rename("temphost",hostLocation)

if __name__ == "__main__":
    updateHost()
