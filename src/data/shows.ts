// ============================================================================
// MOCK DATA — Catálogo Nostalgiando Desenhos
// ============================================================================
import posterPato from "@/assets/poster-pato.jpg";
import posterPedra from "@/assets/poster-pedra.jpg";
import posterToku from "@/assets/poster-toku.jpg";
import posterHeroes from "@/assets/poster-heroes.jpg";
import posterAnos90 from "@/assets/poster-anos90.jpg";
import posterAnos80 from "@/assets/poster-anos80.jpg";
import heroCaverna from "@/assets/hero-caverna-dragao.jpg";
import posterTokusatsu from "@/assets/poster-tokusatsu-heroes.jpg";
import posterHannaBarbera from "@/assets/poster-bau-hanna-barbera.jpg";
import posterAventura from "@/assets/poster-aventura-barbaros.jpg";
import posterClassicosTv from "@/assets/poster-classicos-tv.jpg";

export type Episode = {
  id: string;
  number: number;
  title: string;
  duration: string;
  synopsis: string;
  thumbnail?: string;
  /** Cole aqui a URL de embed do YouTube ou Archive (ex.: https://www.youtube.com/embed/ID) */
  videoUrl: string;
};

export type Show = {
  slug: string;
  title: string;
  year: string;
  category: CategoryId;
  poster: string;
  synopsis: string;
  archiveId?: string; // Para consumir dinamicamente a API do Internet Archive
  episodes: Episode[];
};

export const CATEGORIES = [
  { id: "todos", label: "Todos", shortLabel: "Todos", description: "Todos os clássicos reunidos" },
  {
    id: "catalogo",
    label: "Catálogo",
    shortLabel: "Catálogo",
    description: "Todos os desenhos clássicos e títulos reunidos no Nostalgiando.",
  },
  {
    id: "classicos-tv-aberta",
    label: "Clássicos da TV Aberta",
    shortLabel: "TV Aberta",
    description: "Desenhos imortais que dominavam as manhãs: Pica-Pau, Tom & Jerry, Popeye e mais.",
  },
  {
    id: "tokusatsu",
    label: "Tokusatsu & Heróis Japoneses",
    shortLabel: "Tokusatsu",
    description: "Dedicado a Ninja Jiraiya, Jaspion, Flashman, Cybercop e armaduras lendárias.",
  },
  {
    id: "bau-hanna-barbera",
    label: "O Baú da Hanna-Barbera",
    shortLabel: "Hanna-Barbera",
    description: "O espaço perfeito para Super Globetrotters, Zé Buscapé, Scooby-Doo e Corrida Maluca.",
  },
  {
    id: "aventura-fantasia",
    label: "Aventura & Fantasia",
    shortLabel: "Aventura & Fantasia",
    description: "Guerreiros, monstros e bárbaros antigos: Caverna do Dragão, Thundarr, He-Man e ThunderCats.",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const ep = (n: number, title: string, synopsis: string, duration = "22 min", videoUrl = ""): Episode => ({
  id: `ep-${n}`,
  number: n,
  title: `Episódio ${n}: ${title}`,
  duration,
  synopsis,
  videoUrl, // <- Inserir aqui a URL do iframe (YouTube / Archive / MP4)
});

export const SHOWS: Show[] = [
  // ==========================================
  // AVENTURA & FANTASIA (Destaque Principal)
  // ==========================================
  {
    slug: "caverna-do-dragao",
    title: "Caverna do Dragão",
    year: "1983",
    category: "aventura-fantasia",
    poster: heroCaverna,
    archiveId: "caverna-do-dragao-completo-ptbr-paixaoflix",
    synopsis:
      "Seis jovens entram em uma montanha-russa mágica e acabam presos em um reino de aventuras, monstros e magia. Acompanhe a jornada épica de Hank, Eric, Diana, Presto, Sheila e Bobby em busca do caminho de casa.",
    episodes: [
      ep(1, "A Noite Sem Amanhã", "Seis jovens chegam ao Reino e recebem suas armas mágicas do Mestre dos Magos para enfrentar o temível Vingador.", "21:45"),
      ep(2, "O Olho do Observador", "A turma precisa encontrar o mítico Observador na esperança de descobrir um portal de volta para o mundo real.", "22:10"),
      ep(3, "O Salão dos Ossos", "O Mestre dos Magos guia os jovens heróis até o Salão dos Ossos para recarregar a energia vital das armas mágicas.", "21:50"),
      ep(4, "O Vale dos Unicórnios", "Bobby, Sheila e a turma lutam contra os caçadores do Vingador para salvar a pequena Uni e sua manada.", "22:05"),
      ep(5, "Em Busca do Mestre dos Magos", "O Mestre dos Magos é capturado e os seis heróis embarcam em uma perigosa missão até o pântano negro.", "22:15"),
      ep(6, "A Prisão da Ilusão", "Uma misteriosa ilusão mágica no pântano testa os maiores desejos e a coragem de cada jovem.", "21:30"),
      ep(7, "O Jardim de Zinn", "Bobby é envenenado por um monstro espinhoso e a turma precisa encontrar a cura na estufa da Rainha Zinn.", "22:20"),
      ep(8, "O Servo do Mal", "Karak, o carcereiro de Venger, aprisiona os heróis na Prisão da Agonia.", "21:55"),
      ep(9, "O Castelo nas Nuvens", "Um gigante celestial oferece uma saída do reino caso os heróis resgatem sua princesa aprisionada.", "22:12"),
      ep(10, "O Dia do Mestre dos Magos", "Presto recebe os poderes do Mestre dos Magos por um dia, mas descobre o peso da responsabilidade.", "22:40"),
      ep(11, "A Cidade à Margem da Meia-Noite", "Crianças do Reino desaparecem sob a influência do monstro da Meia-Noite e Hank lidera o resgate.", "22:00"),
      ep(12, "O Traidor", "Eric é enfeitiçado e parece trair seus amigos em troca de uma passagem garantida para casa.", "21:50"),
    ],
  },
  {
    slug: "thundarr-o-barbaro",
    title: "Thundarr, o Bárbaro",
    year: "1980",
    category: "aventura-fantasia",
    poster: posterAventura,
    synopsis:
      "Numa Terra pós-apocalíptica repleta de ruínas futuristas e feitiçaria, o bárbaro Thundarr empunha a Espada Solar ao lado da feiticeira Ookla e da princesa Ariel.",
    episodes: [
      ep(1, "O Segredo do Vale Proibido", "Thundarr descobre uma fortaleza antiga protegida por feitiçaria sombria.", "21:30"),
      ep(2, "A Espada Solar em Chamas", "Uma batalha contra magos mutantes nos restos de uma metrópole submersa.", "21:45"),
      ep(3, "Os Salteadores do Vento", "Ariel e Ookla resgatam prisioneiros de guerreiros voadores no deserto.", "22:00"),
      ep(4, "A Cidade dos Magos Negros", "O trio enfrenta um feiticeiro cibernético que controla autômatos antigos.", "21:50"),
      ep(5, "O Despertar do Vulcão", "Uma corrida contra o tempo para salvar uma vila pacífica antes da erupção mágica.", "22:10"),
      ep(6, "O Coliseu do Terror", "Thundarr é capturado e forçado a lutar como gladiador em uma arena futurista.", "21:40"),
      ep(7, "O Segredo da Rainha do Gelo", "Uma feiticeira congelante ameaça mergulhar os vales em um inverno eterno.", "22:05"),
      ep(8, "A Batalha pela Terra", "Thundarr lidera uma coalizão de guerreiros contra o maior tirano do continente.", "22:30"),
    ],
  },
  {
    slug: "he-man",
    title: "He-Man e os Mestres do Universo",
    year: "1983",
    category: "aventura-fantasia",
    poster: posterAventura,
    synopsis:
      "Pelos poderes de Grayskull! O Príncipe Adam se transforma no homem mais poderoso do universo para proteger Eternia contra as forças malignas do Esqueleto.",
    episodes: [
      ep(1, "O Raio Cósmico de Grayskull", "O Esqueleto planeja invadir o castelo ancestral usando um artefato dimensional.", "22:00"),
      ep(2, "O Dragão da Montanha", "He-Man e o Gato Guerreiro enfrentam uma criatura ancestral nas profundezas de Eternia.", "21:50"),
      ep(3, "A Maldição da Feiticeira", "Mentor e Teela correm contra o tempo para quebrar um feitiço de Maligna.", "22:15"),
      ep(4, "A Invasão dos Homens-Serpente", "Uma raça subterrânea adormecida desperta ameaçando a Cidade Real.", "22:10"),
      ep(5, "O Segredo da Espada de Poder", "O Príncipe Adam descobre segredos ocultos sobre a forja de sua lâmina mística.", "21:55"),
      ep(6, "A Fuga da Montanha da Serpente", "Gorpo se perde na fortaleza do Esqueleto e precisa ser resgatado.", "22:05"),
      ep(7, "O Cristal de Sevilha", "Um artefato que multiplica a força do portador vira alvo de uma disputa feroz.", "21:45"),
      ep(8, "O Duelo em Grayskull", "O confronto épico definitivo nos portões do Castelo de Grayskull.", "22:35"),
    ],
  },
  {
    slug: "thundercats",
    title: "ThunderCats",
    year: "1985",
    category: "aventura-fantasia",
    poster: posterHeroes,
    synopsis:
      "Thunder, Thunder, ThunderCats, Hooo! Lion-O empunha a Espada Justiceira com o Olho de Thundera para liderar os nobres felinos no Terceiro Mundo contra Mumm-Ra.",
    episodes: [
      ep(1, "Êxodo para o Terceiro Mundo", "Após a destruição de Thundera, os ThunderCats encontram seu novo refúgio no Terceiro Mundo.", "22:20"),
      ep(2, "A Aliança dos Mutantes", "Os mutantes de Plun-Darr se unem à múmia imortal Mumm-Ra na Pirâmide Negra.", "22:15"),
      ep(3, "A Torre das Armadilhas", "Panthro e Cheetara testam suas habilidades para resgatar os companheiros.", "21:50"),
      ep(4, "A Espada Justiceira em Perigo", "Mumm-Ra usa feitiçaria antiga para tentar ofuscar a visão além do alcance do Olho de Thundera.", "22:05"),
      ep(5, "O Retorno de Grune, o Destruidor", "O espírito do lendário guerreiro rebelde retorna em busca de vingança.", "22:30"),
      ep(6, "A Sabedoria de Jaga", "Lion-O recebe a aparição espectral de Jaga com ensinamentos essenciais de liderança.", "21:40"),
      ep(7, "O Desafio dos Berbils", "Criaturas pacíficas constroem a lendária Toca dos Gatos para os heróis.", "22:00"),
      ep(8, "A Batalha da Pirâmide Negra", "Lion-O e os ThunderCats invadem a fortaleza do mal em um confronto fulminante.", "22:45"),
    ],
  },

  // ==========================================
  // CLÁSSICOS DA TV ABERTA
  // ==========================================
  {
    slug: "pica-pau",
    title: "Pica-Pau",
    year: "1957",
    category: "classicos-tv-aberta",
    poster: posterClassicosTv,
    synopsis:
      "A risada mais famosa da animação clássica de TV. Travessuras sem limites, perseguições e confusões inesquecíveis com Zeca Urubu e Leôncio.",
    episodes: [
      ep(1, "A Serralheria Maluca", "Pica-Pau decide consertar o telhado do vizinho — do jeito mais barulhento possível.", "07:15"),
      ep(2, "O Barbeiro de Sevilha", "O pássaro travesso assume a barbearia da cidade ao som de ópera clássica.", "06:50"),
      ep(3, "Pica-Pau Come Fora", "Em busca de um banquete gratuito, o Pica-Pau transforma o restaurante em um caos.", "07:05"),
      ep(4, "O Biruta", "Um clássico onde o Pica-Pau apronta todas ao tentar renovar sua carteira de motorista.", "06:40"),
      ep(5, "Quem Cozinha Quem?", "Durante o inverno rigoroso, o Pica-Pau e o lobo disputam a despensa.", "07:20"),
      ep(6, "Campeão de Golfe", "Uma partida de golfe cheia de trapaças e bolas explosivas.", "06:55"),
      ep(7, "Férias na Montanha", "Uma pescaria aparentemente tranquila vira uma avalanche de trapalhadas.", "07:10"),
      ep(8, "Noite no Museu Antigo", "Estátuas, múmias e um pássaro curioso demais explorando as galerias.", "07:30"),
      ep(9, "O Vale dos Monstros", "Pica-Pau encontra um cientista excêntrico e suas invenções malucas.", "06:45"),
      ep(10, "O Pica-Pau Espião", "Missões secretas, disfarces hilários e o temível Zeca Urubu.", "07:12"),
      ep(11, "Concerto na Floresta", "Uma apresentação sinfônica onde cada nota vira uma piada visual.", "07:00"),
      ep(12, "Roubando a Cena", "Pica-Pau invade os bastidores de um estúdio de cinema de Hollywood.", "07:25"),
    ],
  },
  {
    slug: "tom-e-jerry",
    title: "Tom & Jerry",
    year: "1965",
    category: "classicos-tv-aberta",
    poster: posterClassicosTv,
    synopsis:
      "A rivalidade mais icônica da história dos desenhos. O gato obstinado Tom tenta capturar o astuto rato Jerry em perseguições eletrizantes e hilárias.",
    episodes: [
      ep(1, "O Duelo no Quintal", "Tom prepara armadilhas engenhosas, mas Jerry vira o jogo com um pedaço de queijo.", "06:40"),
      ep(2, "Concerto de Piano", "Um concerto clássico vira um campo de batalha musical incontrolável.", "07:35"),
      ep(3, "O Piquenique do Spike", "O buldogue Spike só queria uma tarde tranquila de descanso no gramado.", "06:55"),
      ep(4, "Jerry e o Patinho", "Jerry tenta proteger um patinho recém-nascido das garras de Tom.", "07:10"),
      ep(5, "Noite de Natal", "A trégua de fim de ano é testada pelos presentes e pela lareira acesa.", "07:20"),
      ep(6, "O Rato Invisível", "Jerry descobre uma tinta invisível e apronta todas com o felino desavisado.", "06:45"),
      ep(7, "Trabalho de Alta Classe", "Tom tenta conquistar uma gatinha elegante mas Jerry rouba a cena.", "07:00"),
      ep(8, "Gato e Rato no Espaço", "A perseguição cósmica em gravidade zero cheia de explosões.", "07:15"),
    ],
  },
  {
    slug: "popeye",
    title: "Popeye, o Marinheiro",
    year: "1960",
    category: "classicos-tv-aberta",
    poster: posterClassicosTv,
    synopsis:
      "O marinheiro comedor de espinafre enfrenta as trapaças de Brutus para defender sua amada Olívia Palito com muita força e humor.",
    episodes: [
      ep(1, "O Resgate no Farol", "Brutus trama uma emboscada na praia e Popeye precisa do seu espinafre mágico.", "06:15"),
      ep(2, "O Torneio de Boxe", "Uma luta emocionante nos ringues pelos aplausos de Olívia Palito.", "06:30"),
      ep(3, "Aventura em Alto-Mar", "Monstros marinhos e ondas gigantes não assustam o velho marinheiro.", "06:45"),
      ep(4, "O Mistério da Ilha Perdida", "Em busca de um tesouro pirata, Popeye e Dudu encontram perigos exóticos.", "07:00"),
      ep(5, "Espinafre em Lata Especial", "Brutus tenta sabotar o suprimento de vegetais do herói dos mares.", "06:20"),
      ep(6, "O Parque de Diversões", "Uma disputa nas montanhas-russas para impressionar Olívia.", "06:40"),
      ep(7, "Popeye e o Bebê Gênio", "Gugu apronta travessuras no canteiro de obras e Popeye corre para salvar o dia.", "06:50"),
      ep(8, "O Grande Navio a Vapor", "Uma corrida pelos rios do sul com muita pirotecnia náutica.", "07:10"),
    ],
  },
  {
    slug: "pato-donald",
    title: "Pato Donald",
    year: "1962",
    category: "classicos-tv-aberta",
    poster: posterPato,
    synopsis:
      "O marinheiro mais temperamental e carismático do mundo enfrenta o dia a dia com pouca paciência e muito riso garantido.",
    episodes: [
      ep(1, "Café da Manhã Impossível", "Uma torradeira teimosa e abelhas contra o pato mais estressado.", "07:10"),
      ep(2, "Sobrinhos em Ação", "Huguinho, Zezinho e Luisinho aprontam pegadinhas no quintal.", "06:55"),
      ep(3, "O Piquenique Selvagem", "Formigas organizadas em marcha roubam a cesta inteira.", "07:05"),
      ep(4, "Donald no Farol da Ilha", "Tentando manter a luz acesa durante uma tempestade e uma gaivota teimosa.", "06:45"),
      ep(5, "O Jardineiro Revoltado", "Uma guerra contra esquilos traquinas que roubam suas nozes.", "07:20"),
      ep(6, "Donald e a Máquina de Pipoca", "Uma invenção automática que explode em milho por todo o bairro.", "06:35"),
      ep(7, "Dia de Acampamento", "Montar uma barraca de camping nunca foi tão difícil e hilário.", "07:15"),
      ep(8, "Donald e o Relógio Antigo", "As engrenagens de um relógio de pêndulo desafiam a paciência do pato.", "06:50"),
    ],
  },

  // ==========================================
  // TOKUSATSU & HERÓIS JAPONESES
  // ==========================================
  {
    slug: "ninja-jiraiya",
    title: "Jiraiya: O Incrível Ninja",
    year: "1988",
    category: "tokusatsu",
    poster: posterTokusatsu,
    synopsis:
      "Touha Yamaji veste a armadura ninja e empunha a lendária Espada Olímpica como Jiraiya para defender o artefato Pako contra os ninjas do Império dos Monstros.",
    episodes: [
      ep(1, "A Sucessão da Espada Olímpica", "Touha recebe a lendária armadura ninja de seu mestre Tetsuzan Yamaji.", "23:10"),
      ep(2, "A Invasão dos Ninjas do Vento", "O clã Dokusai envia seus guerreiros mais velozes para roubar a espada.", "22:50"),
      ep(3, "O Confronto na Floresta Sagrada", "Jiraiya utiliza a técnica da Espada Olímpica em combate fulminante.", "23:00"),
      ep(4, "O Segredo de Pako", "Revelações ancestrais sobre o tesouro espacial cobiçado por todos os ninjas do mundo.", "22:45"),
      ep(5, "A Chegada de Kazenin", "Um poderoso rival do vento desafia Touha em um duelo de honra.", "23:15"),
      ep(6, "A Fúria do Império dos Monstros", "Dokusai invoca criaturas demoníacas para sitiar o dojo dos Yamaji.", "22:55"),
      ep(7, "A Espada Olímpica Reluzente", "O golpe derradeiro que quebra as trevas dos ninjas malignos.", "23:20"),
      ep(8, "A Batalha Final pelo Destino", "O confronto épico decisivo no cume da montanha sagrada.", "23:40"),
    ],
  },
  {
    slug: "o-fantastico-jaspion",
    title: "O Fantástico Jaspion",
    year: "1985",
    category: "tokusatsu",
    poster: posterTokusatsu,
    synopsis:
      "Criado pelo profeta Edin, o herói Jaspion veste a Armadura Metaltex e pilota o robô gigante Daileon para salvar a Terra dos monstros gigantes de Satan Goss.",
    episodes: [
      ep(1, "O Planeta de Edin", "Jaspion recebe a profecia galáctica e viaja pelo universo em sua nave Daileon.", "23:30"),
      ep(2, "O Despertar dos Monstros", "Satan Goss enfurece as criaturas gigantes na Terra e o Daileon é convocado.", "23:15"),
      ep(3, "O Duelo com MacGaren", "O temível filho de Satan Goss surge para desafiar a Espada Laser de Jaspion.", "23:25"),
      ep(4, "A Fúria de Satan Goss", "Cidades inteiras tremem quando o senhor das trevas se manifesta.", "23:05"),
      ep(5, "O Raio Cósmico de Daileon", "O gigante guerreiro Daileon usa seu golpe lendário Cosmic Laser.", "23:20"),
      ep(6, "A Menina e o Monstro", "Uma criatura pacífica é manipulada pelos vilões e Jaspion tenta salvá-la.", "22:50"),
      ep(7, "O Pássaro Dourado", "A lendária criatura mística ressurge trazendo esperança para a humanidade.", "23:35"),
      ep(8, "A Batalha Final", "O confronto definitivo contra MacGaren e a transformação final de Satan Goss.", "24:00"),
    ],
  },
  {
    slug: "comando-estelar-flashman",
    title: "Comando Estelar Flashman",
    year: "1986",
    category: "tokusatsu",
    poster: posterToku,
    synopsis:
      "Cinco jovens raptados da Terra e criados nos satélites do Planeta Flash retornam como guerreiros de Prisma para proteger seu planeta natal do Império Mess.",
    episodes: [
      ep(1, "A Terra em Perigo", "Os cinco guerreiros Flashman aterrissam de volta ao seu planeta de origem.", "22:50"),
      ep(2, "O Monstro Biológico", "Doutor Lee Keflen cria uma besta genética para destruir a metrópole.", "22:40"),
      ep(3, "Flash King em Combate", "O poderoso robô gigante entra em ação com a Espada Cósmica.", "23:10"),
      ep(4, "O Prisma de Cristal", "Os heróis descobrem novas combinações de poder para seus trajes.", "22:35"),
      ep(5, "O Segredo das Origens", "Cada membro do esquadrão busca pistas sobre suas famílias humanas.", "23:00"),
      ep(6, "A Invasão de Mess", "Monstros quiméricos atacam as usinas de energia da cidade.", "22:45"),
      ep(7, "A Dança das Espadas", "Uma batalha coreografada contra os generais do imperador La Deus.", "23:15"),
      ep(8, "Adeus, Planeta Terra", "O dramático e inesquecível desfecho da saga dos heróis espaciais.", "23:50"),
    ],
  },
  {
    slug: "cybercop",
    title: "Cybercop: Os Policiais do Futuro",
    year: "1989",
    category: "tokusatsu",
    poster: posterAnos80,
    synopsis:
      "Na Tóquio futurista, a Unidade ZAC utiliza as avançadas Cyberarmaduras de Júpiter, Marte, Saturno e Mercúrio para deter o sindicato do crime Death Trap.",
    episodes: [
      ep(1, "Polícia do Futuro em Ação", "Shinya Takeda surge do futuro vestindo a misteriosa Cyberarmadura de Júpiter.", "23:00"),
      ep(2, "Armadilha Cibernética", "A organização Death Trap hackeia os sistemas centrais da metrópole.", "22:45"),
      ep(3, "O Ataque Cyber Thunder", "Os quatro guerreiros unem suas armas na lendária unidade de disparo pesado.", "23:10"),
      ep(4, "O Segredo de Lúcifer", "Um quinto guerreiro solitário com armadura negra surge com objetivos misteriosos.", "23:25"),
      ep(5, "A Unidade ZAC em Perigo", "A base da polícia é cercada por androides de combate avançados.", "22:55"),
      ep(6, "A Fênix de Júpiter", "Takeda desbloqueia o poder total de sua armadura em combate de alta velocidade.", "23:15"),
      ep(7, "O Plano do Barão Kageyama", "O cérebro por trás da Death Trap revela seu objetivo de dominação temporal.", "23:05"),
      ep(8, "A Batalha pelo Século 21", "O confronto de Cyberarmaduras que decide o futuro da humanidade.", "23:40"),
    ],
  },

  // ==========================================
  // O BAÚ DA HANNA-BARBERA
  // ==========================================
  {
    slug: "super-globetrotters",
    title: "Os Super Globetrotters",
    year: "1979",
    category: "bau-hanna-barbera",
    poster: posterHannaBarbera,
    synopsis:
      "O famoso time de basquete Harlem Globetrotters ganha superpoderes como Homem-Mola, Homem-Fluido, Homem-Bolas e Homem-Chapa para combater o crime e vencer partidas intergalácticas.",
    episodes: [
      ep(1, "O Ataque do Museu de Cera", "Os Globetrotters descobrem figuras de cera ganhando vida à noite no museu.", "21:40"),
      ep(2, "A Partida Intergaláctica", "Vilões do espaço desafiam o time para um jogo que vale o destino da Terra.", "22:00"),
      ep(3, "O Segredo da Bola de Ouro", "Uma relíquia ancestral de basquete com poderes mágicos desaparece do ginásio.", "21:50"),
      ep(4, "O Monstro do Gramado", "Criaturas gigantes invadem o estádio durante a final do campeonato.", "21:35"),
      ep(5, "O Homem-Mola ao Resgate", "Acrobacias elásticas salvam a cidade de uma represa em colapso.", "21:55"),
      ep(6, "O Enigma do Doutor Crime", "Um cientista louco congela os árbitros e tenta roubar os troféus.", "22:10"),
      ep(7, "Basquete nas Nuvens", "Uma quadra voadora testará a gravidade e o humor dos heróis das quadras.", "21:45"),
      ep(8, "A Grande Vitória", "O drible definitivo que salva a cidade em um festival comemorativo.", "22:20"),
    ],
  },
  {
    slug: "ze-buscape",
    title: "Zé Buscapé (Família Buscapé)",
    year: "1965",
    category: "bau-hanna-barbera",
    poster: posterHannaBarbera,
    synopsis:
      "As hilárias confusões da família de ursos caipiras das montanhas: Zé Buscapé que só quer dormir, a enérgica Bié e os pequenos Florzinha e Chapeuzinho.",
    episodes: [
      ep(1, "A Festa da Colina", "Zé Buscapé tenta escapar das tarefas domésticas para tocar seu banjo na varanda.", "06:30"),
      ep(2, "O Vizinho Barulhento", "Uma disputa hilária pela melhor cerca de madeira da fazenda.", "06:45"),
      ep(3, "Dia de Pesca na Represa", "O urso mais sonolento da animação vai pescar e arruma muita confusão.", "06:20"),
      ep(4, "A Espingarda de Sal", "Bié bota todo mundo para correr quando a comida da horta desaparece.", "06:50"),
      ep(5, "O Carro Troglodita do Zé", "Construir um automóvel caseiro nunca gerou tantas explosões de fumaça.", "06:15"),
      ep(6, "O Duelo de Banjos", "Um festival de música caipira onde Zé disputa o prêmio com o xerife.", "06:40"),
      ep(7, "A Sesta Interrompida", "Todas as tentativas de tirar uma soneca tranquila dão errado.", "06:25"),
      ep(8, "O Bolo de Maçã da Bié", "A família inteira tenta provar o bolo antes da hora e a confusão é geral.", "06:35"),
    ],
  },
  {
    slug: "scooby-doo",
    title: "Scooby-Doo, Cadê Você?",
    year: "1969",
    category: "bau-hanna-barbera",
    poster: posterAnos90,
    synopsis:
      "Fred, Velma, Daphne, Salsicha e o cão mais covarde e comilão do mundo viajam na Máquina do Mistério desmascarando monstros e fantasmas por onde passam.",
    episodes: [
      ep(1, "A Noite do Cavaleiro Negro", "Uma armadura medieval ganha vida e assombra as noites do museu arqueológico.", "21:30"),
      ep(2, "O Fantasma do Parque", "Um parque de diversões abandonado esconde um mistério arrepiante.", "21:45"),
      ep(3, "O Monstro do Lago", "Salsicha e Scooby tentam fugir de uma criatura que surge das águas pantanosas.", "22:00"),
      ep(4, "O Fantasma de Ouro", "Uma mina abandonada no velho oeste guarda um fantasma e muitos Biscoitos Scooby.", "21:50"),
      ep(5, "O Castelo do Doutor Frankenstein", "A Máquina do Mistério quebra perto de uma mansão gótica na Transilvânia.", "22:15"),
      ep(6, "A Bruxa do Pântano", "Zumbis e feitiçaria testam a coragem da turma em Nova Orleans.", "21:40"),
      ep(7, "O Fantasma do Teatro", "Luzes piscando e passos misteriosos assombram uma peça de teatro clássica.", "22:05"),
      ep(8, "Desmascarando o Vilão", "A famosa armadilha de Fred finalmente captura o culpado.", "22:25"),
    ],
  },
  {
    slug: "corrida-maluca",
    title: "Corrida Maluca",
    year: "1968",
    category: "bau-hanna-barbera",
    poster: posterPedra,
    synopsis:
      "Onze carros excêntricos disputam o título de Volante Mais Maluco do Mundo, enquanto Dick Vigarista e seu cão Muttley tramam armadilhas sem fim.",
    episodes: [
      ep(1, "A Grande Corrida no Deserto", "Dick Vigarista arma um desvio falso enquanto Penélope Charmosa lidera com estilo.", "21:15"),
      ep(2, "Subindo a Montanha Gelada", "O Carro Troglodita dos Irmãos Rocha enfrenta a neve e o Carro Tanque do Sargento Bombarda.", "21:30"),
      ep(3, "A Reta Final na Metrópole", "Uma chegada milimétrica disputada curva a curva pelos onze pilotos malucos.", "21:45"),
      ep(4, "O Pântano da Trapaça", "Tachinhas na pista e óleo falso: as clássicas traquinagens de Dick e Muttley.", "21:20"),
      ep(5, "O Desfiladeiro do Velho Oeste", "Peter Perfeito acelera sua máquina voadora para salvar Penélope em apuros.", "21:50"),
      ep(6, "A Corrida pela Ilha Tropical", "Vulcões e pontes quebradas aumentam o perigo da competição.", "21:35"),
      ep(7, "O Carro Cupê Assombrado", "Os Monstros da Carruagem Misteriosa assustam todos os competidores na floresta.", "21:40"),
      ep(8, "A Linha de Chegada de Ouro", "A grande cerimônia do troféu com a icônica risadinha do cão Muttley.", "22:00"),
    ],
  },
];

import { db, collection, getDocs, doc, setDoc, deleteDoc } from "@/lib/firebase";

export const FEATURED = SHOWS[0]!;

export const DEFAULT_CATALOG_SHOWS: Show[] = [
  ...SHOWS,
  {
    slug: "corrida-malucadublado",
    title: "Corrida Maluca (Dublado)",
    year: "1968",
    category: "catalogo",
    poster: "https://i.pinimg.com/736x/b2/14/fe/b214fe98d87fad3c8f94a535bd5cdd4f.jpg",
    synopsis: "Desenho clássico com Dick Vigarista e Muttley. Aproveite todos os episódios completos disponíveis no catálogo!",
    archiveId: "corrida-malucadublado",
    episodes: [],
  },
  {
    slug: "caverna-do-dragao_202508",
    title: "Caverna do Dragão (Completo)",
    year: "1983",
    category: "catalogo",
    poster: "https://br.web.img3.acsta.net/r_1280_720/pictures/22/08/10/21/25/5951896.jpg",
    synopsis: "A clássica saga dos seis jovens no reino de magia do Mestre dos Magos e Vingador.",
    archiveId: "caverna-do-dragao_202508",
    episodes: [],
  },
];

const STORAGE_KEY = "nostalgiando_all_shows";
const FIRESTORE_COLLECTION = "shows";

const notifyCatalogUpdated = (shows: Show[]) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("catalog_updated", { detail: shows }));
  }
};

export const getCachedShows = (): Show[] => {
  if (typeof window === "undefined") return DEFAULT_CATALOG_SHOWS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: Show[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler cache:", e);
  }
  // Se ainda não tiver nada no storage, inicializa com DEFAULT_CATALOG_SHOWS
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATALOG_SHOWS));
  } catch {}
  return DEFAULT_CATALOG_SHOWS;
};

export const getAllShows = async (): Promise<Show[]> => {
  if (typeof window === "undefined") {
    return DEFAULT_CATALOG_SHOWS;
  }

  const localShows = getCachedShows();

  // 1. Tenta sincronizar com o Firestore em nuvem sem bloquear
  try {
    if (db) {
      const fetchFromFirestore = async (): Promise<Show[] | null> => {
        const showsCollection = collection(db, FIRESTORE_COLLECTION);
        const snapshot = await getDocs(showsCollection);

        if (!snapshot.empty) {
          return snapshot.docs.map((d) => {
            const data = d.data();
            return {
              slug: data.slug || d.id,
              title: data.title || "",
              year: data.year || "Clássico",
              category: (data.category as CategoryId) || "catalogo",
              poster: data.poster || "",
              synopsis: data.synopsis || "",
              archiveId: data.archiveId || undefined,
              episodes: data.episodes || [],
            };
          });
        }
        return null;
      };

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      const cloudShows = await Promise.race([fetchFromFirestore(), timeoutPromise]);

      if (cloudShows && Array.isArray(cloudShows) && cloudShows.length > 0) {
        // Merge inteligente: junta shows da nuvem com shows locais (preservando alterações locais)
        const mergedMap = new Map<string, Show>();

        // 1. Adiciona da nuvem
        cloudShows.forEach((s) => mergedMap.set(s.slug, s));

        // 2. Sobrepõe com locais que o usuário adicionou ou editou
        localShows.forEach((s) => mergedMap.set(s.slug, s));

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
        notifyCatalogUpdated(mergedList);
        return mergedList;
      } else if (cloudShows === null) {
        // Se a nuvem estiver vazia na primeira vez, envia todo o catálogo local para a nuvem
        localShows.forEach((s) => {
          setDoc(doc(db, FIRESTORE_COLLECTION, s.slug), {
            slug: s.slug,
            title: s.title,
            year: s.year,
            category: s.category,
            poster: s.poster,
            synopsis: s.synopsis,
            archiveId: s.archiveId || null,
            episodes: s.episodes || [],
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        });
      }
    }
  } catch (firestoreErr) {
    console.warn("Aviso Firestore (mantendo local):", firestoreErr);
  }

  return localShows;
};

export const saveShowToStorage = (show: Show): Show[] => {
  if (typeof window === "undefined") return DEFAULT_CATALOG_SHOWS;
  
  // 1. Atualiza localmente imediatamente
  const currentList = getCachedShows();
  const list = [...currentList];
  const index = list.findIndex((s) => s.slug === show.slug);
  if (index >= 0) {
    list[index] = { ...list[index], ...show };
  } else {
    list.unshift(show); // Adiciona no início da lista
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyCatalogUpdated(list);
  } catch (e) {
    console.error("Erro ao salvar no LocalStorage:", e);
  }

  // 2. Salva no Firestore (Nuvem)
  if (db) {
    setDoc(
      doc(db, FIRESTORE_COLLECTION, show.slug),
      {
        slug: show.slug,
        title: show.title,
        year: show.year,
        category: show.category,
        poster: show.poster,
        synopsis: show.synopsis,
        archiveId: show.archiveId || null,
        episodes: show.episodes || [],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((err) => console.error("Erro ao salvar no Firestore:", err));
  }

  return list;
};

export const updateShowInStorage = (slug: string, data: Partial<Show>): Show[] => {
  if (typeof window === "undefined") return DEFAULT_CATALOG_SHOWS;

  // 1. Atualiza localmente imediatamente
  const currentList = getCachedShows();
  const list = [...currentList];
  const index = list.findIndex((s) => s.slug === slug);
  if (index >= 0) {
    list[index] = { ...list[index], ...data };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      notifyCatalogUpdated(list);
    } catch (e) {
      console.error("Erro ao atualizar no LocalStorage:", e);
    }
  }

  // 2. Atualiza no Firestore (Nuvem)
  if (db) {
    const payload: Record<string, any> = { ...data, updatedAt: new Date().toISOString() };
    if (data.archiveId === undefined) {
      delete payload.archiveId;
    }
    setDoc(doc(db, FIRESTORE_COLLECTION, slug), payload, { merge: true }).catch((err) =>
      console.error("Erro ao atualizar no Firestore:", err)
    );
  }

  return list;
};

export const deleteShowFromStorage = (slug: string): Show[] => {
  if (typeof window === "undefined") return DEFAULT_CATALOG_SHOWS;

  // 1. Remove localmente imediatamente
  const currentList = getCachedShows();
  const updated = currentList.filter((s) => s.slug !== slug);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyCatalogUpdated(updated);
  } catch (e) {
    console.error("Erro ao remover no LocalStorage:", e);
  }

  // 2. Remove do Firestore (Nuvem)
  if (db) {
    deleteDoc(doc(db, FIRESTORE_COLLECTION, slug)).catch((err) =>
      console.error("Erro ao deletar no Firestore:", err)
    );
  }

  return updated;
};

export const resetCatalogToDefault = (): Show[] => {
  if (typeof window === "undefined") return DEFAULT_CATALOG_SHOWS;

  // Reseta localmente
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATALOG_SHOWS));
  notifyCatalogUpdated(DEFAULT_CATALOG_SHOWS);

  // Reseta no Firestore
  if (db) {
    DEFAULT_CATALOG_SHOWS.forEach((s) => {
      setDoc(doc(db, FIRESTORE_COLLECTION, s.slug), {
        slug: s.slug,
        title: s.title,
        year: s.year,
        category: s.category,
        poster: s.poster,
        synopsis: s.synopsis,
        archiveId: s.archiveId || null,
        episodes: s.episodes || [],
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.error("Erro ao resetar no Firestore:", err));
    });
  }

  return DEFAULT_CATALOG_SHOWS;
};

export const getShow = async (slug: string) => {
  const allShows = await getAllShows();
  return allShows.find((s) => s.slug === slug);
};

export const shelves = async () => {
  const allShows = await getAllShows();
  return CATEGORIES.filter((c) => c.id !== "todos").map((c) => ({
    ...c,
    shows: c.id === "catalogo" ? allShows : allShows.filter((s) => s.category === c.id),
  }));
};

// Mantido para compatibilidade síncrona temporária onde precisar
export const getStaticShow = (slug: string) => {
  return DEFAULT_CATALOG_SHOWS.find((s) => s.slug === slug) || SHOWS.find((s) => s.slug === slug);
};


