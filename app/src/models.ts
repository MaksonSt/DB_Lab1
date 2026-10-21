export interface Team {
  id: number;
  sport_id: number;
  sport_name: string;
  name: string;
  city: string | null;
  coach_name: string | null;
  members_count: number;
  updated_at: Date;
  updated_by: number | null;
  updated_by_name: string | null;
}

export interface Athlete {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: Date;
  age: number;
  email: string | null;
  current_team_id: number | null;
  current_team_name: string | null;
  updated_at: Date;
  updated_by: number | null;
}

export interface RosterEntry {
  membership_id: number;
  team_id: number;
  team_name: string;
  athlete_id: number;
  athlete_name: string;
  jersey_number: number | null;
}
