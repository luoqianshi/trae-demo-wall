import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AccountInfo, FamilyMember, EmergencyContact, User } from '@core/models';

interface ElderUser {
  id: number;
  userId: number;
  elderId: number;
  role: string;
  elder: { id: number; name: string; avatarUrl?: string };
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private http: HttpClient) {}

  getAccount(): Observable<AccountInfo> {
    return this.http.get<User>(`${environment.apiBaseUrl}/users/me`).pipe(
      map((user) => ({
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        passwordMasked: '****',
      }))
    );
  }

  getFamilyMembers(): Observable<FamilyMember[]> {
    return this.http.get<ElderUser[]>(`${environment.apiBaseUrl}/family/members`).pipe(
      map((rows) =>
        rows.map((row) => ({
          id: String(row.id),
          name: row.elder.name,
          relation: row.role,
          role: this.normalizeRole(row.role),
          roleLabel: this.roleLabel(row.role),
          avatarColor: '#D4763C',
        }))
      )
    );
  }

  getEmergencyContact(): Observable<EmergencyContact | null> {
    return this.http.get<EmergencyContact | null>(`${environment.apiBaseUrl}/users/me/emergency-contact`);
  }

  updateEmergencyContact(payload: {
    name: string;
    relation: string;
    phone: string;
    backupPhone?: string;
  }): Observable<EmergencyContact> {
    return this.http.put<EmergencyContact>(
      `${environment.apiBaseUrl}/users/me/emergency-contact`,
      payload
    );
  }

  deleteEmergencyContact(): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/users/me/emergency-contact`);
  }

  inviteMember(payload: { phone: string; role?: string }): Observable<{ inviteToken: string; message: string }> {
    return this.http.post<{ inviteToken: string; message: string }>(
      `${environment.apiBaseUrl}/family/invite`,
      { phone: payload.phone, role: payload.role ?? 'guardian' }
    );
  }

  acceptInvite(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiBaseUrl}/family/accept/${token}`, {});
  }

  removeMember(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiBaseUrl}/family/members/${id}`);
  }

  private normalizeRole(role: string): 'admin' | 'assistant' | 'elderly' {
    if (role === 'guardian' || role === 'admin') return 'admin';
    if (role === 'elder') return 'elderly';
    return 'assistant';
  }

  private roleLabel(role: string): string {
    const map: Record<string, string> = {
      guardian: '管理员',
      admin: '管理员',
      elder: '被照护人',
      viewer: '查看者',
    };
    return map[role] ?? '协助者';
  }
}
