import { Message } from 'discord.js';
import { TagModel } from '../../../model/tag';
import { MinehutCommand } from '../../../structure/command/minehutCommand';
import { PermissionLevel } from '../../../util/permission/permissionLevel';

export default class TagSetAliasCommand extends MinehutCommand {
	constructor() {
		super('tag-setalias', {
			permissionLevel: PermissionLevel.Support,
			category: 'tag',
			channel: 'guild',
			description: {
				content: 'Set a tag alias',
				usage: '<target> <alias>',
			},
			args: [
				{
					id: 'name',
					type: 'string',
					prompt: {
						start: (msg: Message) =>
							`${msg.author}, which tag do you want this alias to be added to?`,
					},
				},
				{
					id: 'alias',
					type: 'string',
					prompt: {
						start: (msg: Message) =>
							`${msg.author}, what do you want the alias to be?`,
					},
				},
			],
		});
	}

	async exec(msg: Message, { name, alias }: { name: string; alias: string }) {
		name = name.replace(/\s+/g, '-').toLowerCase();
		alias = alias.replace(/\s+/g, '-').toLowerCase();

		const existingTarget = await TagModel.findByNameOrAlias(alias);

		// If alias already points to something, remove it from that something
		// OR if the alias already points to it and the user wanted to do that, say nothing changed
		if (existingTarget) {
			if (existingTarget.name === name || existingTarget.aliases.includes(name))
				return msg.channel.send(':o: nothing changed');
			existingTarget.update({
				aliases: existingTarget.aliases.filter(a => a !== alias),
			});
		}

		const target = await TagModel.findByNameOrAlias(name);
		if (!target)
			return msg.channel.send(`${process.env.EMOJI_CROSS} unknown target \`${name}\``);

		await target.updateOne({ $push: { aliases: alias } });
		target.aliases.push(alias);
		msg.channel.send(
			`${
				process.env.EMOJI_CHECK
			} \`${alias}\` now points to \`${name}\` (aliases: ${target.aliases.join(
				', '
			)})`
		);
	}
}
