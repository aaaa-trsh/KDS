import time
from networktables import NetworkTables
NetworkTables.addConnectionListener(lambda connected, info: print(info, "connected =", connected), immediateNotify=True)
NetworkTables.initialize(server="roborio-6644-frc.local")

wsTable = NetworkTables.getTable("testws")

def changed(table, key, val, new):
    print(f"{key} changed: val is", val)

wsTable.addEntryListener(changed)

while True:
    time.sleep(1)
    print(wsTable.getNumberArray("pos", [0, 0]))