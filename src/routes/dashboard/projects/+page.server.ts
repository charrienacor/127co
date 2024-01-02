import db from "$lib/server/database";
import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ cookies }) => {
    const id = cookies.get("auth-token") || null;
    if (!id)
        throw redirect(302, "/login");

    const role = cookies.get("role");
    if (!["CEO", "Project Manager", "Application Developer"].includes(role!))
        throw redirect(302, "/dashboard");

    const [employees] = await db.Employee.select({
        where: {
            Employee_ID: id,
        },
    });

    const employee = employees[0];
    if (!employee)
        throw redirect(302, "/dashboard");

    let team_leader = null;
    switch (role) {
        case "CEO":
            break;
        case "Project Manager":
            team_leader = id;
            break;
        case "Application Developer":
            team_leader = employee["Employee_ReportsTo"];
            break;
    }

    let options = {};
    if (team_leader)
        options = {
            where: {
                Team_Leader_ID: team_leader,
            }
        };
    const [teams] = await db.Team.select(options);

    let all_projects: any = [];
    for (const team of teams) {
        const [projects] = await db.Project.select({
            where: {
                Project_Team_ID: team["Team_ID"],
            },
        });

        all_projects.push(...projects);
    }

    return {
        projects: all_projects,
    };
}