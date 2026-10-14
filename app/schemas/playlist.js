import { z } from 'zod'

/** A track of the playlist: what to stream (`Id`) and the window the server plays. */
export const AudioTrackSchema = z.object({
  /** Track id for the streaming address; not the content id. */
  Id: z.string(),
  /** Start of the window in the file, seconds (the audiocrop, applied by the server). */
  SkipTo: z.number().nullish(),
  /** Length of the window, seconds: the stream carries no duration of its own. */
  PlayDuration: z.number().nullish(),
  Item: z
    .object({
      Id: z.string(),
      ItemName: z.string().nullish(),
      Title: z.string().nullish(),
      Artist: z.string().nullish(),
      Duration: z.number().nullish(),
    })
    .nullish(),
})

/** The user's playlist: the backend keeps one per user, replaced by every Play. */
export const PlaylistSchema = z.object({
  Id: z.string().nullish(),
  AudioTracks: z.array(AudioTrackSchema).nullish(),
})

/** @typedef {z.infer<typeof AudioTrackSchema>} AudioTrack */
