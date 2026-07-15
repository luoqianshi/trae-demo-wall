import win32file
import win32con
import os

class FileSystemMonitor:
    def __init__(self):
        self.ACTIONS = {
            1: "Created",
            2: "Deleted",
            3: "Updated",
            4: "Renamed from",
            5: "Renamed to"
        }
        
    def start_monitoring(self, path_to_watch):
        hDir = win32file.CreateFile(
            path_to_watch,
            win32con.GENERIC_READ,
            win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE,
            None,
            win32con.OPEN_EXISTING,
            win32con.FILE_FLAG_BACKUP_SEMANTICS,
            None
        )
        
        while True:
            results = win32file.ReadDirectoryChangesW(
                hDir,
                1024,
                True,
                win32con.FILE_NOTIFY_CHANGE_FILE_NAME |
                win32con.FILE_NOTIFY_CHANGE_DIR_NAME |
                win32con.FILE_NOTIFY_CHANGE_ATTRIBUTES |
                win32con.FILE_NOTIFY_CHANGE_SIZE |
                win32con.FILE_NOTIFY_CHANGE_LAST_WRITE |
                win32con.FILE_NOTIFY_CHANGE_SECURITY,
                None,
                None
            )
            
            for action, file_name in results:
                self.handle_fs_event(action, file_name)
                
    def handle_fs_event(self, action, file_name):
        print(f"File {file_name} {self.ACTIONS.get(action, 'Unknown')}") 