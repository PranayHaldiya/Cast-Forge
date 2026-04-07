import { Router, type IRouter } from "express";
import { GetHostPresetsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const PRESETS = [
  {
    id: "comedy-duo",
    name: "Comedy Duo",
    description: "Two comedians who can't agree on anything",
    icon: "Laugh",
    suggestedFormats: ["comedy", "hot_takes"],
    hosts: [
      { name: "Sam", description: "A fast-talking, sarcastic comedian in their 30s with a dry wit and a knack for absurd analogies" },
      { name: "Alex", description: "An enthusiastic, slightly naive optimist who sets up Sam's jokes perfectly without realizing it" },
    ],
  },
  {
    id: "debate-rivals",
    name: "Debate Rivals",
    description: "Two brilliant minds on opposite sides",
    icon: "Swords",
    suggestedFormats: ["debate", "hot_takes"],
    hosts: [
      { name: "Jordan", description: "A sharp, data-driven intellectual who speaks with authority and loves citing studies" },
      { name: "Taylor", description: "A passionate, values-driven thinker who challenges conventional wisdom and speaks from the gut" },
    ],
  },
  {
    id: "crime-narrators",
    name: "Crime Narrators",
    description: "Seasoned true crime investigators",
    icon: "Search",
    suggestedFormats: ["true_crime", "debate"],
    hosts: [
      { name: "Morgan", description: "A seasoned detective with a gravelly, world-weary voice who's seen everything twice" },
      { name: "Casey", description: "A meticulous true crime researcher with a crisp, precise voice and a talent for eerie detail" },
    ],
  },
  {
    id: "explainer-experts",
    name: "Explainer Experts",
    description: "The professor and the curious student",
    icon: "GraduationCap",
    suggestedFormats: ["explainer", "interview"],
    hosts: [
      { name: "Dr. Rivera", description: "A warm, brilliant professor who explains complex ideas with perfect metaphors and contagious enthusiasm" },
      { name: "Jamie", description: "A curious, quick-witted journalist who asks exactly the questions the audience is thinking" },
    ],
  },
  {
    id: "hot-takes-crew",
    name: "Hot Takes Crew",
    description: "Unfiltered opinions, zero apologies",
    icon: "Flame",
    suggestedFormats: ["hot_takes", "comedy"],
    hosts: [
      { name: "Blake", description: "A confident, outspoken cultural critic with sharp opinions and zero filter" },
      { name: "Quinn", description: "An equally opinionated contrarian who disagrees on principle and makes it entertaining" },
    ],
  },
  {
    id: "interview-masters",
    name: "Interview Masters",
    description: "Insider knowledge meets probing questions",
    icon: "Mic2",
    suggestedFormats: ["interview", "explainer"],
    hosts: [
      { name: "Diana", description: "A veteran journalist with a razor-sharp interview style and a gift for the perfect follow-up" },
      { name: "Marcus", description: "A subject-matter expert who speaks with infectious passion and always has a surprising insider story" },
    ],
  },
];

router.get("/castforge/presets", async (_req, res): Promise<void> => {
  res.json(GetHostPresetsResponse.parse(PRESETS));
});

export default router;
