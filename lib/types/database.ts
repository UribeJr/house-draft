export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      draft_picks: {
        Row: {
          created_at: string
          draft_id: string
          houseguest_id: string
          id: string
          league_id: string
          league_member_id: string
          pick_number: number
          round: number
        }
        Insert: {
          created_at?: string
          draft_id: string
          houseguest_id: string
          id?: string
          league_id: string
          league_member_id: string
          pick_number: number
          round: number
        }
        Update: {
          created_at?: string
          draft_id?: string
          houseguest_id?: string
          id?: string
          league_id?: string
          league_member_id?: string
          pick_number?: number
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "draft_picks_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_houseguest_id_fkey"
            columns: ["houseguest_id"]
            isOneToOne: false
            referencedRelation: "houseguests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_league_member_id_fkey"
            columns: ["league_member_id"]
            isOneToOne: false
            referencedRelation: "league_leaderboard"
            referencedColumns: ["league_member_id"]
          },
          {
            foreignKeyName: "draft_picks_league_member_id_fkey"
            columns: ["league_member_id"]
            isOneToOne: false
            referencedRelation: "league_members"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          completed_at: string | null
          current_pick: number
          id: string
          league_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["draft_status"]
          total_picks: number | null
        }
        Insert: {
          completed_at?: string | null
          current_pick?: number
          id?: string
          league_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          total_picks?: number | null
        }
        Update: {
          completed_at?: string | null
          current_pick?: number
          id?: string
          league_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          total_picks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drafts_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: true
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      houseguests: {
        Row: {
          age: number | null
          created_at: string
          hometown: string | null
          id: string
          image_url: string | null
          name: string
          occupation: string | null
          placement: number | null
          season_id: string
          status: Database["public"]["Enums"]["houseguest_status"]
        }
        Insert: {
          age?: number | null
          created_at?: string
          hometown?: string | null
          id?: string
          image_url?: string | null
          name: string
          occupation?: string | null
          placement?: number | null
          season_id: string
          status?: Database["public"]["Enums"]["houseguest_status"]
        }
        Update: {
          age?: number | null
          created_at?: string
          hometown?: string | null
          id?: string
          image_url?: string | null
          name?: string
          occupation?: string | null
          placement?: number | null
          season_id?: string
          status?: Database["public"]["Enums"]["houseguest_status"]
        }
        Relationships: [
          {
            foreignKeyName: "houseguests_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      league_members: {
        Row: {
          draft_position: number | null
          id: string
          joined_at: string
          league_id: string
          team_name: string
          user_id: string
        }
        Insert: {
          draft_position?: number | null
          id?: string
          joined_at?: string
          league_id: string
          team_name: string
          user_id: string
        }
        Update: {
          draft_position?: number | null
          id?: string
          joined_at?: string
          league_id?: string
          team_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          commissioner_id: string
          created_at: string
          draft_type: string
          id: string
          invite_code: string
          name: string
          predictions_locked_at: string | null
          roster_size: number
          season_id: string
          status: Database["public"]["Enums"]["league_status"]
          trade_approval_required: boolean
          trades_enabled: boolean
        }
        Insert: {
          commissioner_id: string
          created_at?: string
          draft_type?: string
          id?: string
          invite_code: string
          name: string
          predictions_locked_at?: string | null
          roster_size: number
          season_id: string
          status?: Database["public"]["Enums"]["league_status"]
          trade_approval_required?: boolean
          trades_enabled?: boolean
        }
        Update: {
          commissioner_id?: string
          created_at?: string
          draft_type?: string
          id?: string
          invite_code?: string
          name?: string
          predictions_locked_at?: string | null
          roster_size?: number
          season_id?: string
          status?: Database["public"]["Enums"]["league_status"]
          trade_approval_required?: boolean
          trades_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leagues_commissioner_id_fkey"
            columns: ["commissioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          id: string
          league_id: string
          league_member_id: string
          predicted_first_boot_id: string | null
          predicted_winner_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          league_id: string
          league_member_id: string
          predicted_first_boot_id?: string | null
          predicted_winner_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          league_member_id?: string
          predicted_first_boot_id?: string | null
          predicted_winner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_league_member_id_fkey"
            columns: ["league_member_id"]
            isOneToOne: true
            referencedRelation: "league_leaderboard"
            referencedColumns: ["league_member_id"]
          },
          {
            foreignKeyName: "predictions_league_member_id_fkey"
            columns: ["league_member_id"]
            isOneToOne: true
            referencedRelation: "league_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_predicted_first_boot_id_fkey"
            columns: ["predicted_first_boot_id"]
            isOneToOne: false
            referencedRelation: "houseguests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_predicted_winner_id_fkey"
            columns: ["predicted_winner_id"]
            isOneToOne: false
            referencedRelation: "houseguests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
      rosters: {
        Row: {
          acquired_at: string
          acquisition_type: Database["public"]["Enums"]["acquisition_type"]
          houseguest_id: string
          id: string
          league_id: string
          league_member_id: string
          released_at: string | null
          trade_id: string | null
        }
        Insert: {
          acquired_at?: string
          acquisition_type: Database["public"]["Enums"]["acquisition_type"]
          houseguest_id: string
          id?: string
          league_id: string
          league_member_id: string
          released_at?: string | null
          trade_id?: string | null
        }
        Update: {
          acquired_at?: string
          acquisition_type?: Database["public"]["Enums"]["acquisition_type"]
          houseguest_id?: string
          id?: string
          league_id?: string
          league_member_id?: string
          released_at?: string | null
          trade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rosters_houseguest_id_fkey"
            columns: ["houseguest_id"]
            isOneToOne: false
            referencedRelation: "houseguests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_league_member_id_fkey"
            columns: ["league_member_id"]
            isOneToOne: false
            referencedRelation: "league_leaderboard"
            referencedColumns: ["league_member_id"]
          },
          {
            foreignKeyName: "rosters_league_member_id_fkey"
            columns: ["league_member_id"]
            isOneToOne: false
            referencedRelation: "league_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_events: {
        Row: {
          created_at: string
          created_by: string
          episode: number | null
          event_type: Database["public"]["Enums"]["event_type"]
          houseguest_id: string | null
          id: string
          league_id: string
          league_member_id: string | null
          notes: string | null
          occurred_at: string
          points: number
          week: number
        }
        Insert: {
          created_at?: string
          created_by: string
          episode?: number | null
          event_type: Database["public"]["Enums"]["event_type"]
          houseguest_id?: string | null
          id?: string
          league_id: string
          league_member_id?: string | null
          notes?: string | null
          occurred_at?: string
          points: number
          week: number
        }
        Update: {
          created_at?: string
          created_by?: string
          episode?: number | null
          event_type?: Database["public"]["Enums"]["event_type"]
          houseguest_id?: string | null
          id?: string
          league_id?: string
          league_member_id?: string | null
          notes?: string | null
          occurred_at?: string
          points?: number
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_events_houseguest_id_fkey"
            columns: ["houseguest_id"]
            isOneToOne: false
            referencedRelation: "houseguests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_events_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_events_league_member_id_fkey"
            columns: ["league_member_id"]
            isOneToOne: false
            referencedRelation: "league_leaderboard"
            referencedColumns: ["league_member_id"]
          },
          {
            foreignKeyName: "scoring_events_league_member_id_fkey"
            columns: ["league_member_id"]
            isOneToOne: false
            referencedRelation: "league_members"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_rules: {
        Row: {
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          league_id: string
          points: number
        }
        Insert: {
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          league_id: string
          points: number
        }
        Update: {
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          league_id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_rules_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_items: {
        Row: {
          from_member_id: string | null
          houseguest_id: string
          id: string
          trade_id: string
        }
        Insert: {
          from_member_id?: string | null
          houseguest_id: string
          id?: string
          trade_id: string
        }
        Update: {
          from_member_id?: string | null
          houseguest_id?: string
          id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_items_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "league_leaderboard"
            referencedColumns: ["league_member_id"]
          },
          {
            foreignKeyName: "trade_items_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "league_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_houseguest_id_fkey"
            columns: ["houseguest_id"]
            isOneToOne: false
            referencedRelation: "houseguests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string
          id: string
          league_id: string
          proposer_member_id: string
          recipient_member_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["trade_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          proposer_member_id: string
          recipient_member_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          proposer_member_id?: string
          recipient_member_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
        }
        Relationships: [
          {
            foreignKeyName: "trades_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_proposer_member_id_fkey"
            columns: ["proposer_member_id"]
            isOneToOne: false
            referencedRelation: "league_leaderboard"
            referencedColumns: ["league_member_id"]
          },
          {
            foreignKeyName: "trades_proposer_member_id_fkey"
            columns: ["proposer_member_id"]
            isOneToOne: false
            referencedRelation: "league_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_recipient_member_id_fkey"
            columns: ["recipient_member_id"]
            isOneToOne: false
            referencedRelation: "league_leaderboard"
            referencedColumns: ["league_member_id"]
          },
          {
            foreignKeyName: "trades_recipient_member_id_fkey"
            columns: ["recipient_member_id"]
            isOneToOne: false
            referencedRelation: "league_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      league_leaderboard: {
        Row: {
          league_id: string | null
          league_member_id: string | null
          rank: number | null
          team_name: string | null
          total_points: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_scoring_events: {
        Row: {
          attributed_member_id: string | null
          created_at: string | null
          episode: number | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          houseguest_id: string | null
          id: string | null
          league_id: string | null
          notes: string | null
          occurred_at: string | null
          points: number | null
          week: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_events_houseguest_id_fkey"
            columns: ["houseguest_id"]
            isOneToOne: false
            referencedRelation: "houseguests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_events_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_scores: {
        Row: {
          league_id: string | null
          league_member_id: string | null
          points: number | null
          week: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_events_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _execute_trade: { Args: { p_trade_id: string }; Returns: undefined }
      _trade_still_valid: { Args: { p_trade_id: string }; Returns: boolean }
      add_scoring_event: {
        Args: {
          p_episode?: number
          p_event_type: Database["public"]["Enums"]["event_type"]
          p_houseguest_id?: string
          p_league_id: string
          p_league_member_id?: string
          p_notes?: string
          p_occurred_at?: string
          p_week: number
        }
        Returns: string
      }
      approve_trade: {
        Args: { p_approve: boolean; p_trade_id: string }
        Returns: Database["public"]["Enums"]["trade_status"]
      }
      award_finale_bonuses: { Args: { p_league_id: string }; Returns: number }
      create_league: {
        Args: {
          p_name: string
          p_roster_size: number
          p_season_id: string
          p_team_name: string
          p_trade_approval_required: boolean
          p_trades_enabled: boolean
        }
        Returns: {
          invite_code: string
          league_id: string
        }[]
      }
      is_league_commissioner: {
        Args: { p_league_id: string }
        Returns: boolean
      }
      is_league_member: { Args: { p_league_id: string }; Returns: boolean }
      join_league_with_code: {
        Args: { p_invite_code: string; p_team_name: string }
        Returns: string
      }
      lock_predictions: { Args: { p_league_id: string }; Returns: undefined }
      make_draft_pick: {
        Args: { p_houseguest_id: string; p_league_id: string }
        Returns: Json
      }
      predictions_locked: { Args: { p_league_id: string }; Returns: boolean }
      propose_trade: {
        Args: {
          p_league_id: string
          p_my_houseguest_id: string
          p_their_houseguest_id: string
        }
        Returns: string
      }
      respond_to_trade: {
        Args: { p_accept: boolean; p_trade_id: string }
        Returns: Database["public"]["Enums"]["trade_status"]
      }
      start_draft: {
        Args: { p_league_id: string; p_member_order?: string[] }
        Returns: undefined
      }
      update_houseguest_status: {
        Args: {
          p_houseguest_id: string
          p_placement?: number
          p_status: Database["public"]["Enums"]["houseguest_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      acquisition_type: "draft" | "trade"
      draft_status: "pending" | "active" | "completed"
      event_type:
        | "HOH_WIN"
        | "VETO_WIN"
        | "VETO_USED"
        | "SAVED_WITH_VETO"
        | "DIAMOND_VETO_USED"
        | "SURVIVED_EVICTION"
        | "NOMINATED"
        | "REPLACEMENT_NOMINEE"
        | "EVICTED"
        | "MADE_JURY"
        | "MADE_FINAL_5"
        | "MADE_FINAL_3"
        | "RUNNER_UP"
        | "WINNER"
        | "AMERICA_FAVORITE"
        | "BLOCK_BUSTER_WIN"
        | "MEDIEVAL_ROUND_WIN"
        | "TIME_CAPSULE_SELECTED"
        | "TIME_CAPSULE_POWER"
        | "TIME_CAPSULE_PUNISHMENT"
        | "CORRECT_WINNER_PICK"
        | "CORRECT_FIRST_BOOT"
      houseguest_status: "active" | "evicted" | "jury" | "finalist" | "winner"
      league_status: "setup" | "drafting" | "active" | "completed"
      trade_status: "pending" | "accepted" | "rejected" | "vetoed" | "approved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      acquisition_type: ["draft", "trade"],
      draft_status: ["pending", "active", "completed"],
      event_type: [
        "HOH_WIN",
        "VETO_WIN",
        "VETO_USED",
        "SAVED_WITH_VETO",
        "DIAMOND_VETO_USED",
        "SURVIVED_EVICTION",
        "NOMINATED",
        "REPLACEMENT_NOMINEE",
        "EVICTED",
        "MADE_JURY",
        "MADE_FINAL_5",
        "MADE_FINAL_3",
        "RUNNER_UP",
        "WINNER",
        "AMERICA_FAVORITE",
        "BLOCK_BUSTER_WIN",
        "MEDIEVAL_ROUND_WIN",
        "TIME_CAPSULE_SELECTED",
        "TIME_CAPSULE_POWER",
        "TIME_CAPSULE_PUNISHMENT",
        "CORRECT_WINNER_PICK",
        "CORRECT_FIRST_BOOT",
      ],
      houseguest_status: ["active", "evicted", "jury", "finalist", "winner"],
      league_status: ["setup", "drafting", "active", "completed"],
      trade_status: ["pending", "accepted", "rejected", "vetoed", "approved"],
    },
  },
} as const
